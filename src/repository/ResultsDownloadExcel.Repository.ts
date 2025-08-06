import ExcelJS from 'exceljs';
import { Response } from 'express';
import { connectToSqlServer } from '../DB/config';
import { getModelImprovementByIdOrder } from './Results.repository';

// export const downloadExcelResultsByOrder = async (
//     idOrder: number,
//     res: Response
// ) => {
//     const db = await connectToSqlServer();
//     if (!db) throw new Error("No se pudo conectar a la base de datos");

//     const modelsResult = await db
//         .request()
//         .input("idOrder", idOrder)
//         .query(`
//       SELECT DISTINCT model
//       FROM TB_Results
//       WHERE idOrder = @idOrder
//     `);

//     const allModels = modelsResult.recordset.map((row: any) => row.model);

//     const allowedModels = [
//         'EvenDistribution',
//         'EvenVolume',
//         'EvenVolumeDynamic',
//         'TopFrequencies',
//     ];

//     const currentModels: any = {
//         EvenDistribution: 'CurrentEvenDistribution',
//         EvenVolume: 'CurrentEvenVolume',
//         EvenVolumeDynamic: 'CurrentEvenVolumeDynamic',
//         TopFrequencies: 'CurrentTopFrequencies',
//     };

//     const filteredModels = allowedModels.filter(
//         (m) => allModels.includes(m) || allModels.includes(currentModels[m])
//     );

//     const workbook = new ExcelJS.Workbook();

//     for (const model of filteredModels) {
//         const modelExists = allModels.includes(model);
//         const currentModelName = currentModels[model];
//         const currentModelExists = allModels.includes(currentModelName);

//         // Resultados del modelo principal
//         let results: any[] = [];
//         if (modelExists) {
//             const resultsQuery = await db.request()
//                 .input("idOrder", idOrder)
//                 .input("model", model)
//                 .query(`
//           SELECT r.*
//           FROM TB_Results r
//           LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
//           WHERE r.idOrder = @idOrder AND r.model = @model
//           ORDER BY r.boxNumber, r.id
//         `);
//             results = resultsQuery.recordset;
//         }

//         // Resultados del modelo Current...
//         let currentResults: any[] = [];
//         if (currentModelExists) {
//             const currentResultsQuery = await db.request()
//                 .input("idOrder", idOrder)
//                 .input("model", currentModelName)
//                 .query(`
//           SELECT r.*
//           FROM TB_Results r
//           LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
//           WHERE r.idOrder = @idOrder AND r.model = @model
//           ORDER BY r.boxNumber, r.id
//         `);
//             currentResults = currentResultsQuery.recordset;
//         }

//         // Agregar hoja para el modelo principal
//         if (results.length > 0) {
//             const sheet = workbook.addWorksheet(model);
//             sheet.columns = Object.keys(results[0]).map(key => ({ header: key, key }));
//             results.forEach(row => sheet.addRow(row));
//         }

//         // Agregar hoja para el modelo Current...
//         if (currentResults.length > 0) {
//             const sheet = workbook.addWorksheet(currentModelName);
//             sheet.columns = Object.keys(currentResults[0]).map(key => ({ header: key, key }));
//             currentResults.forEach(row => sheet.addRow(row));
//         }
//     }

//     res.setHeader(
//         'Content-Type',
//         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//     );
//     res.setHeader(
//         'Content-Disposition',
//         `attachment; filename=results_order_${idOrder}.xlsx`
//     );
//     await workbook.xlsx.write(res);
//     res.end();
// };

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

  const currentModels: Record<string, string> = {
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

    // Función para procesar un modelo (optimizado o current)
    const processModel = async (modelName: string) => {
      const resultsQuery = await db.request()
        .input("idOrder", idOrder)
        .input("model", modelName)
        .query(`
          SELECT r.id, r.idOrder,
          r.idAttributeData,
          r.idShipmenDataFile,
          r.model,
          r.boxNumber,
          s.cubedItemLength,
          s.cubedItemWidth,
          s.cubedItemHeight,
          s.cubedItemWeight,
          s.cubingMethod,
          r.newAssignedBoxLength,
          r.newAssignedBoxWidth,
          r.newAssignedBoxHeight,
          s.currentAssignedBoxLength,
          s.currentAssignedBoxWidth,
          s.currentAssignedBoxHeight,
          r.currentBoxCorrugateArea,
          r.newBoxCorrugateArea,
          r.currentBoxCorrugateCost,
          r.newBoxCorrugateCost,
          r.currentDimWeight,
          r.newDimWeight,
          r.currentBillableWeight,
          s.orderId,
          r.newBillableWeight,
          r.currentFreightCost,
          r.newFreightCost,
          r.currentVoidVolume,
          r.newVoidVolume,
          r.currentVoidFillCost,
          r.newVoidFillCost
          FROM TB_Results r
          LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
          WHERE r.idOrder = @idOrder AND r.model = @model
          ORDER BY r.boxNumber, r.id
        `);

      const rows = resultsQuery.recordset;

      const groupedByBox: Record<string, any[]> = {};

      rows.forEach(row => {
        const boxKey = `${modelName}Box${row.boxNumber}`;
        if (!groupedByBox[boxKey]) {
          groupedByBox[boxKey] = [];
        }
        groupedByBox[boxKey].push(row);
      });

      for (const sheetName in groupedByBox) {
        const data = groupedByBox[sheetName];
        const sheet = workbook.addWorksheet(sheetName.substring(0, 31)); // Excel max 31 chars
        sheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
        data.forEach(row => sheet.addRow(row));
      }
    };

    if (modelExists) await processModel(model);
    if (currentModelExists) await processModel(currentModelName);
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
  ] as const;

  const workbook = new ExcelJS.Workbook();

  for (const model of modelsOptimized) {
    const totalBoxNumbersResult = await db.request()
      .input("idOrder", idOrder)
      .input("model", model)
      .query(`
        SELECT COUNT(DISTINCT boxNumber) AS total
        FROM TB_Results
        WHERE idOrder = @idOrder AND model = @model
      `);

    const totalBoxes = totalBoxNumbersResult.recordset[0]?.total || 0;
    const pageSize = 10;
    const totalPages = Math.ceil(totalBoxes / pageSize);

    const allImprovements = [];

    for (let page = 1; page <= totalPages; page++) {
      const improvements = await getModelImprovementByIdOrder(idOrder, model, page, pageSize);
      allImprovements.push(...improvements);
    }

    if (allImprovements.length > 0) {
      const sheet = workbook.addWorksheet(`${model}_Improvements`);
      sheet.columns = [
        { header: 'Box Number', key: 'boxNumber' },
        { header: 'Dimensional Weight Improvement (%)', key: 'DimensionalWeightImprovement' },
        { header: 'Estimated Freight Improvement (%)', key: 'EstimatedTotalFreightImprovement' },
        { header: 'Void Volume Improvement (%)', key: 'VoidVolumeImprovement' },
        { header: 'Void Fill Cost Improvement (%)', key: 'VoidFillCostImprovement' },
        { header: 'Corrugate Area Improvement (%)', key: 'CorrugateAreaImprovement' },
        { header: 'Corrugate Cost Improvement (%)', key: 'CorrugateCostImprovement' },
      ];

      allImprovements.forEach(row => {
        sheet.addRow({
          boxNumber: row.boxNumber,
          DimensionalWeightImprovement: Number((row.DimensionalWeightImprovement * 100).toFixed(2)),
          EstimatedTotalFreightImprovement: Number((row.EstimatedTotalFreightImprovement * 100).toFixed(2)),
          VoidVolumeImprovement: Number((row.VoidVolumeImprovement * 100).toFixed(2)),
          VoidFillCostImprovement: Number((row.VoidFillCostImprovement * 100).toFixed(2)),
          CorrugateAreaImprovement: Number((row.CorrugateAreaImprovement * 100).toFixed(2)),
          CorrugateCostImprovement: Number((row.CorrugateCostImprovement * 100).toFixed(2)),
        });
      });
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