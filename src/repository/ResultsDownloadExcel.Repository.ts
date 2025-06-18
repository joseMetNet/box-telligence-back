import ExcelJS from 'exceljs';
import { Response } from 'express';
import { connectToSqlServer } from '../DB/config';

export const downloadExcelResultsByOrder = async (
    idOrder: number,
    res: Response
) => {
    const db = await connectToSqlServer();
    if (!db) throw new Error("No se pudo conectar a la base de datos");

    const modelsResult = await db
        .request()
        .input("idOrder", idOrder)
        .query(`
      SELECT DISTINCT model
      FROM TB_Results
      WHERE idOrder = @idOrder
    `);

    const allModels = modelsResult.recordset.map((row: any) => row.model);

    const allowedModels = [
        'EvenDistribution',
        'EvenVolume',
        'EvenVolumeDynamic',
        'TopFrequencies',
    ];

    const currentModels: any = {
        EvenDistribution: 'CurrentEvenDistribution',
        EvenVolume: 'CurrentEvenVolume',
        EvenVolumeDynamic: 'CurrentEvenVolumeDynamic',
        TopFrequencies: 'CurrentTopFrequencies',
    };

    const filteredModels = allowedModels.filter(
        (m) => allModels.includes(m) || allModels.includes(currentModels[m])
    );

    const workbook = new ExcelJS.Workbook();

    for (const model of filteredModels) {
        const modelExists = allModels.includes(model);
        const currentModelName = currentModels[model];
        const currentModelExists = allModels.includes(currentModelName);

        // Resultados del modelo principal
        let results: any[] = [];
        if (modelExists) {
            const resultsQuery = await db.request()
                .input("idOrder", idOrder)
                .input("model", model)
                .query(`
          SELECT r.*
          FROM TB_Results r
          LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
          WHERE r.idOrder = @idOrder AND r.model = @model
          ORDER BY r.boxNumber, r.id
        `);
            results = resultsQuery.recordset;
        }

        // Resultados del modelo Current...
        let currentResults: any[] = [];
        if (currentModelExists) {
            const currentResultsQuery = await db.request()
                .input("idOrder", idOrder)
                .input("model", currentModelName)
                .query(`
          SELECT r.*
          FROM TB_Results r
          LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
          WHERE r.idOrder = @idOrder AND r.model = @model
          ORDER BY r.boxNumber, r.id
        `);
            currentResults = currentResultsQuery.recordset;
        }

        // Agregar hoja para el modelo principal
        if (results.length > 0) {
            const sheet = workbook.addWorksheet(model);
            sheet.columns = Object.keys(results[0]).map(key => ({ header: key, key }));
            results.forEach(row => sheet.addRow(row));
        }

        // Agregar hoja para el modelo Current...
        if (currentResults.length > 0) {
            const sheet = workbook.addWorksheet(currentModelName);
            sheet.columns = Object.keys(currentResults[0]).map(key => ({ header: key, key }));
            currentResults.forEach(row => sheet.addRow(row));
        }
    }

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=results_order_${idOrder}.xlsx`
    );
    await workbook.xlsx.write(res);
    res.end();
};

//en caso de que se quiera implementar una ruta para descargar el Excel de porcentajes por modelo optimizado agregar el modelo como parámetro

// export const downloadExcelResultsPercentajeByOrder = async (
//   idOrder: number,
//   model: "EvenDistribution" | "TopFrequencies" | "EvenVolumeDynamic" | "EvenVolume",
//   res: Response
// ) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const currentModel = `Current${model}`;

//   // Optimized results
//   const optimizedResult: any = await db.request()
//     .input("idOrder", idOrder)
//     .input("model", model)
//     .query(`
//       SELECT * FROM TB_Results
//       WHERE idOrder = @idOrder AND model = @model
//       ORDER BY id ASC
//     `);

//   // Current results
//   const currentResult: any = await db.request()
//     .input("idOrder", idOrder)
//     .input("model", currentModel)
//     .query(`
//       SELECT * FROM TB_Results
//       WHERE idOrder = @idOrder AND model = @model
//       ORDER BY id ASC
//     `);

//   const currentWeights = currentResult.recordset.map((r: any) => r.newBillableWeight);
//   const currentFreights = currentResult.recordset.map((r: any) => r.newFreightCost);
//   const currentVoidVolumes = currentResult.recordset.map((r: any) => r.newVoidVolume);
//   const currentVoidFillCosts = currentResult.recordset.map((r: any) => r.newVoidFillCost);
//   const currentCorrugateAreas = currentResult.recordset.map((r: any) => r.newBoxCorrugateArea);
//   const currentCorrugateCosts = currentResult.recordset.map((r: any) => r.newBoxCorrugateCost);

//   const improvements = optimizedResult.recordset.map((opt: any, idx: number) => {
//     return {
//       id: opt.id,
//       boxNumber: opt.boxNumber,
//       DimensionalWeightImprovement:
//         currentWeights[idx] > 0 ? 1 - (opt.newBillableWeight / currentWeights[idx]) : 0,
//       EstimatedTotalFreightImprovement:
//         currentFreights[idx] > 0 ? 1 - (opt.newFreightCost / currentFreights[idx]) : 0,
//       VoidVolumeImprovement:
//         currentVoidVolumes[idx] > 0 ? 1 - (opt.newVoidVolume / currentVoidVolumes[idx]) : 0,
//       VoidFillCostImprovement:
//         currentVoidFillCosts[idx] > 0 ? 1 - (opt.newVoidFillCost / currentVoidFillCosts[idx]) : 0,
//       CorrugateAreaImprovement:
//         currentCorrugateAreas[idx] > 0 ? 1 - (opt.newBoxCorrugateArea / currentCorrugateAreas[idx]) : 0,
//       CorrugateCostImprovement:
//         currentCorrugateCosts[idx] > 0 ? 1 - (opt.newBoxCorrugateCost / currentCorrugateCosts[idx]) : 0,
//     };
//   });

//   // Crear Excel
//   const workbook = new ExcelJS.Workbook();
//   const sheet = workbook.addWorksheet(`${model}_Improvements`);

//   if (improvements.length > 0) {
//     sheet.columns = Object.keys(improvements[0]).map(key => ({
//       header: key,
//       key,
//     }));
//     improvements.forEach((row:any) => sheet.addRow(row));
//   }

//   res.setHeader(
//     'Content-Type',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//   );
//   res.setHeader(
//     'Content-Disposition',
//     `attachment; filename=improvements_order_${idOrder}_${model}.xlsx`
//   );
//   await workbook.xlsx.write(res);
//   res.end();
// };

export const downloadExcelResultsPercentajeByOrder = async (
  idOrder: number,
  res: Response
) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const modelsOptimized = [
    "EvenDistribution",
    "TopFrequencies",
    "EvenVolumeDynamic",
    "EvenVolume"
  ];

  const workbook = new ExcelJS.Workbook();

  for (const model of modelsOptimized) {
    const currentModel = `Current${model}`;

    // Optimized results
    const optimizedResult: any = await db.request()
      .input("idOrder", idOrder)
      .input("model", model)
      .query(`
        SELECT * FROM TB_Results
        WHERE idOrder = @idOrder AND model = @model
        ORDER BY id ASC
      `);

    // Current results
    const currentResult: any = await db.request()
      .input("idOrder", idOrder)
      .input("model", currentModel)
      .query(`
        SELECT * FROM TB_Results
        WHERE idOrder = @idOrder AND model = @model
        ORDER BY id ASC
      `);

    if (!optimizedResult.recordset.length || !currentResult.recordset.length) continue;

    const currentWeights = currentResult.recordset.map((r: any) => r.newBillableWeight);
    const currentFreights = currentResult.recordset.map((r: any) => r.newFreightCost);
    const currentVoidVolumes = currentResult.recordset.map((r: any) => r.newVoidVolume);
    const currentVoidFillCosts = currentResult.recordset.map((r: any) => r.newVoidFillCost);
    const currentCorrugateAreas = currentResult.recordset.map((r: any) => r.newBoxCorrugateArea);
    const currentCorrugateCosts = currentResult.recordset.map((r: any) => r.newBoxCorrugateCost);

    const improvements = optimizedResult.recordset.map((opt: any, idx: number) => {
      return {
        id: opt.id,
        boxNumber: opt.boxNumber,
        DimensionalWeightImprovement:
          currentWeights[idx] > 0 ? 1 - (opt.newBillableWeight / currentWeights[idx]) : 0,
        EstimatedTotalFreightImprovement:
          currentFreights[idx] > 0 ? 1 - (opt.newFreightCost / currentFreights[idx]) : 0,
        VoidVolumeImprovement:
          currentVoidVolumes[idx] > 0 ? 1 - (opt.newVoidVolume / currentVoidVolumes[idx]) : 0,
        VoidFillCostImprovement:
          currentVoidFillCosts[idx] > 0 ? 1 - (opt.newVoidFillCost / currentVoidFillCosts[idx]) : 0,
        CorrugateAreaImprovement:
          currentCorrugateAreas[idx] > 0 ? 1 - (opt.newBoxCorrugateArea / currentCorrugateAreas[idx]) : 0,
        CorrugateCostImprovement:
          currentCorrugateCosts[idx] > 0 ? 1 - (opt.newBoxCorrugateCost / currentCorrugateCosts[idx]) : 0,
      };
    });

    // Crear hoja solo si hay mejoras
    if (improvements.length > 0) {
      const sheet = workbook.addWorksheet(`${model}_Improvements`);
      sheet.columns = Object.keys(improvements[0]).map(key => ({
        header: key,
        key,
      }));
      improvements.forEach((row: any) => sheet.addRow(row));
    }
  }

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=improvements_order_${idOrder}.xlsx`
  );
  await workbook.xlsx.write(res);
  res.end();
};