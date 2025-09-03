import ExcelJS from 'exceljs';
import { Response } from 'express';
import { connectToSqlServer } from '../DB/config';
import { getModelImprovementByIdOrder } from './Results.repository';
import * as sql from 'mssql';

// export const downloadExcelResultsByOrder = async (
//   idOrder: number,
//   res: Response
// ) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const modelsResult = await db
//     .request()
//     .input("idOrder", idOrder)
//     .query(`
//       SELECT DISTINCT model
//       FROM TB_Results
//       WHERE idOrder = @idOrder
//     `);

//   const allModels = modelsResult.recordset.map((row: any) => row.model);

//   const allowedModels = [
//     'EvenDistribution',
//     'EvenVolume',
//     'EvenVolumeDynamic',
//     'TopFrequencies',
//   ];

//   const currentModels: Record<string, string> = {
//     EvenDistribution: 'CurrentEvenDistribution',
//     EvenVolume: 'CurrentEvenVolume',
//     EvenVolumeDynamic: 'CurrentEvenVolumeDynamic',
//     TopFrequencies: 'CurrentTopFrequencies',
//   };

//   const filteredModels = allowedModels.filter(
//     (m) => allModels.includes(m) || allModels.includes(currentModels[m])
//   );

//   const workbook = new ExcelJS.Workbook();

//   for (const model of filteredModels) {
//     const modelExists = allModels.includes(model);
//     const currentModelName = currentModels[model];
//     const currentModelExists = allModels.includes(currentModelName);

//     // Función para procesar un modelo (optimizado o current)
//     const processModel = async (modelName: string) => {
//       const resultsQuery = await db.request()
//         .input("idOrder", idOrder)
//         .input("model", modelName)
//         .query(`
//           SELECT r.id, r.idOrder,
//           r.idAttributeData,
//           r.idShipmenDataFile,
//           r.model,
//           r.boxNumber,
//           s.cubedItemLength,
//           s.cubedItemWidth,
//           s.cubedItemHeight,
//           s.cubedItemWeight,
//           s.cubingMethod,
//           r.newAssignedBoxLength,
//           r.newAssignedBoxWidth,
//           r.newAssignedBoxHeight,
//           s.currentAssignedBoxLength,
//           s.currentAssignedBoxWidth,
//           s.currentAssignedBoxHeight,
//           r.currentBoxCorrugateArea,
//           r.newBoxCorrugateArea,
//           r.currentBoxCorrugateCost,
//           r.newBoxCorrugateCost,
//           r.currentDimWeight,
//           r.newDimWeight,
//           r.currentBillableWeight,
//           s.orderId,
//           r.newBillableWeight,
//           r.currentFreightCost,
//           r.newFreightCost,
//           r.currentVoidVolume,
//           r.newVoidVolume,
//           r.currentVoidFillCost,
//           r.newVoidFillCost
//           FROM TB_Results r
//           LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
//           WHERE r.idOrder = @idOrder AND r.model = @model
//           ORDER BY r.boxNumber, r.id
//         `);

//       const rows = resultsQuery.recordset;

//       const groupedByBox: Record<string, any[]> = {};

//       rows.forEach(row => {
//         const boxKey = `${modelName}Box${row.boxNumber}`;
//         if (!groupedByBox[boxKey]) {
//           groupedByBox[boxKey] = [];
//         }
//         groupedByBox[boxKey].push(row);
//       });

//       for (const sheetName in groupedByBox) {
//         const data = groupedByBox[sheetName];
//         const sheet = workbook.addWorksheet(sheetName.substring(0, 31)); // Excel max 31 chars
//         sheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));
//         data.forEach(row => sheet.addRow(row));
//       }
//     };

//     if (modelExists) await processModel(model);
//     if (currentModelExists) await processModel(currentModelName);
//   }

//   res.setHeader(
//     'Content-Type',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//   );
//   res.setHeader(
//     'Content-Disposition',
//     `attachment; filename=results_order_${idOrder}.xlsx`
//   );

//   await workbook.xlsx.write(res);
//   res.end();
// };

export const downloadExcelResultsByOrder = async (
  idOrder: number,
  res: Response
) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error('No se pudo conectar a la base de datos');

  const modelsResult = await db
    .request()
    .input('idOrder', idOrder)
    .query(`
      SELECT DISTINCT model
      FROM TB_Results
      WHERE idOrder = @idOrder
    `);

  const allModels: string[] = modelsResult.recordset.map((r: any) => r.model);

  const allowedModels = [
    'EvenDistribution',
    'EvenVolume',
    'EvenVolumeDynamic',
    'TopFrequencies',
  ] as const;

  const currentModels: Record<(typeof allowedModels)[number], string> = {
    EvenDistribution: 'CurrentEvenDistribution',
    EvenVolume: 'CurrentEvenVolume',
    EvenVolumeDynamic: 'CurrentEvenVolumeDynamic',
    TopFrequencies: 'CurrentTopFrequencies',
  };

  const present: string[] = [];
  for (const base of allowedModels) {
    if (allModels.includes(base)) present.push(base);
    const cur = currentModels[base];
    if (allModels.includes(cur)) present.push(cur);
  }

  if (present.length === 0) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=results_order_${idOrder}.xlsx`);
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('Empty');
    await wb.xlsx.write(res);
    res.end();
    return;
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=results_order_${idOrder}.xlsx`);

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: false,
    useSharedStrings: false,
  });

  type WSInfo = { ws: ExcelJS.Worksheet; columns: string[]; initialized: boolean };
  const sheets = new Map<string, WSInfo>();

  const getSheet = (sheetName: string, rowObj: any) => {
    let info = sheets.get(sheetName);
    if (!info) {
      const safeName = sheetName.substring(0, 31);
      const ws = workbook.addWorksheet(safeName);
      info = { ws, columns: Object.keys(rowObj), initialized: false };
      sheets.set(sheetName, info);
    }
    if (!info.initialized) {
      info.ws.columns = info.columns.map((key) => ({ header: key, key }));
      info.initialized = true;
    }
    return info.ws;
  };

  const req = new sql.Request(db);
  req.stream = true;
  req.input('idOrder', sql.Int, idOrder);
  const modelParams: string[] = [];
  present.forEach((m, idx) => {
    const name = `m${idx}`;
    modelParams.push(`@${name}`);
    req.input(name, sql.NVarChar(100), m);
  });

  const sqlText = `
    SELECT
      r.id, r.idOrder, r.idAttributeData, r.idShipmenDataFile, r.model, r.boxNumber,
      s.cubedItemLength, s.cubedItemWidth, s.cubedItemHeight, s.cubedItemWeight, s.cubingMethod,
      r.newAssignedBoxLength, r.newAssignedBoxWidth, r.newAssignedBoxHeight,
      s.currentAssignedBoxLength, s.currentAssignedBoxWidth, s.currentAssignedBoxHeight,
      r.currentBoxCorrugateArea, r.newBoxCorrugateArea,
      r.currentBoxCorrugateCost, r.newBoxCorrugateCost,
      r.currentDimWeight, r.newDimWeight,
      r.currentBillableWeight, r.newBillableWeight,
      r.currentFreightCost, r.newFreightCost,
      r.currentVoidVolume, r.newVoidVolume,
      r.currentVoidFillCost, r.newVoidFillCost,
      s.[orderId] AS shipmentOrderId
    FROM TB_Results r
    LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
    WHERE r.idOrder = @idOrder
      AND r.model IN (${modelParams.join(',')})
    ORDER BY r.model, r.boxNumber, r.id;
  `;

  req.on('row', (row: any) => {
    const sheetKey = `${row.model}Box${row.boxNumber}`;
    const ws = getSheet(sheetKey, row);
    ws.addRow(row).commit();
  });

  req.on('error', (err: any) => {
    try { workbook.commit(); } catch {}
    console.error('downloadExcelResultsByOrder stream error:', err);
  });

  req.on('done', async () => {
    for (const { ws } of sheets.values()) {
      (ws as any).commit?.();
    }
    await workbook.commit();
  });

  req.query(sqlText).catch((e) => {
    console.error('downloadExcelResultsByOrder query error:', e);
  });
};
export const downloadExcelSumaryDataFromResults = async (
  idOrder: number,
  res: Response
) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const allowedModels = [
    "EvenDistribution",
    "EvenVolume",
    "EvenVolumeDynamic",
    "TopFrequencies",
  ] as const;

  const currentModels: Record<(typeof allowedModels)[number], string> = {
    EvenDistribution: "CurrentEvenDistribution",
    EvenVolume: "CurrentEvenVolume",
    EvenVolumeDynamic: "CurrentEvenVolumeDynamic",
    TopFrequencies: "CurrentTopFrequencies",
  };

  const modelsResult = await db
    .request()
    .input("idOrder", idOrder)
    .query(`
      SELECT DISTINCT model
      FROM TB_Results
      WHERE idOrder = @idOrder
    `);

  const allModels: string[] = modelsResult.recordset.map((r: any) => r.model);
  const filteredModels = allowedModels.filter(
    (m) => allModels.includes(m) || allModels.includes(currentModels[m])
  );

  if (!filteredModels.length) {
    res.status(404).json({ message: "No hay datos para este idOrder." });
    return;
  }

  const workbook = new ExcelJS.Workbook();

  const writeRows = (sheetName: string, rows: any[]) => {
    if (!rows?.length) return;
    const sheet = workbook.addWorksheet(sheetName.substring(0, 31));
    const headers = Object.keys(rows[0]);
    sheet.columns = headers.map((k) => ({ header: k, key: k }));
    rows.forEach((r) => sheet.addRow(r));
  };

  const writeSummary = (
    model: string,
    cards: { label: string; value: any }[],
    stats: { totalBoxesUsed: any; minBoxNumber: any; maxBoxNumber: any }
  ) => {
    const sheet = workbook.addWorksheet(`${model}_Summary`.substring(0, 31));
    sheet.columns = [
      { header: "label", key: "label" },
      { header: "value", key: "value" },
    ];
    cards.forEach((c) => sheet.addRow(c));
    sheet.addRow({});
    sheet.addRow({ label: "totalBoxesUsed", value: stats.totalBoxesUsed });
    sheet.addRow({ label: "minBoxNumber", value: stats.minBoxNumber });
    sheet.addRow({ label: "maxBoxNumber", value: stats.maxBoxNumber });
  };

  for (const model of filteredModels) {
    const currentModelName = currentModels[model];
    const modelExists = allModels.includes(model);
    const currentExists = allModels.includes(currentModelName);

    const statsResult = await db
      .request()
      .input("idOrder", idOrder)
      .query(`
        SELECT 
          currentBoxUsed AS totalBoxesUsed,
          minimunNumBox AS minBoxNumber,
          maximunNumBox AS maxBoxNumber
        FROM TB_AttributeData
        WHERE idOrder = @idOrder
      `);

    const {
      totalBoxesUsed,
      minBoxNumber,
      maxBoxNumber
    } = statsResult.recordset[0] || {
      totalBoxesUsed: 0,
      minBoxNumber: null,
      maxBoxNumber: null
    };

    const summaryCards = [
      { label: "Current Number of Boxes Used", value: totalBoxesUsed },
      { label: "Minimum Number of Boxes to Analyze", value: minBoxNumber },
      { label: "Maximum Number of Boxes to Analyze", value: maxBoxNumber },
    ];

    if (modelExists) {
      const resultsQuery = await db
        .request()
        .input("idOrder", idOrder)
        .input("model", model)
        .query(`
          SELECT idOrder, model, boxNumber,
                 SUM(CAST(newBillableWeight   AS FLOAT))            AS newBillableWeight,
                 SUM(CAST(newFreightCost      AS FLOAT))            AS newFreightCost,
                 SUM(CAST(newVoidVolume       AS FLOAT))            AS newVoidVolume,
                 SUM(CAST(newVoidFillCost     AS FLOAT))            AS newVoidFillCost,
                 SUM(CAST(newBoxCorrugateArea AS FLOAT)) / 144      AS newBoxCorrugateArea,
                 SUM(CAST(newBoxCorrugateCost AS FLOAT))            AS newBoxCorrugateCost
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
          GROUP BY idOrder, model, boxNumber
          ORDER BY boxNumber
        `);

      const results = resultsQuery.recordset || [];
      writeRows(`${model}_Results`, results);
    }

    if (currentExists) {
      const currentQuery = await db
        .request()
        .input("idOrder", idOrder)
        .input("model", currentModelName)
        .query(`
          SELECT idOrder, model, boxNumber,
                 SUM(CAST(currentBillableWeight   AS FLOAT))            AS currentBillableWeight,
                 SUM(CAST(currentFreightCost      AS FLOAT))            AS currentFreightCost,
                 SUM(CAST(currentVoidVolume       AS FLOAT))            AS currentVoidVolume,
                 SUM(CAST(currentVoidFillCost     AS FLOAT))            AS currentVoidFillCost,
                 SUM(CAST(currentBoxCorrugateArea AS FLOAT)) / 144      AS currentBoxCorrugateArea,
                 SUM(CAST(currentBoxCorrugateCost AS FLOAT))            AS currentBoxCorrugateCost
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
          GROUP BY idOrder, model, boxNumber
          ORDER BY boxNumber
        `);

      const currentRows = currentQuery.recordset || [];
      writeRows(`${currentModelName}_Results`, currentRows);
    }

    writeSummary(model, summaryCards, { totalBoxesUsed, minBoxNumber, maxBoxNumber });
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=sumaryData_order_${idOrder}.xlsx`
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