import { connectToSqlServer } from "../DB/config";
import { ShipmentItem, IResultsPaginated, IResult } from "../interface/Results.Interface";
import _ from 'lodash';

export const getResultsByOrder = async (
  idOrder: number,
  page: number = 1,
  pageSize: number = 10
): Promise<IResultsPaginated> => {
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
    (model) => allModels.includes(model) || allModels.includes(currentModels[model])
  );

  const modelGroups = [];

  for (const model of filteredModels) {
    const modelExists = allModels.includes(model);
    const currentModelName = currentModels[model];
    const currentModelExists = allModels.includes(currentModelName);

    let results: any[] = [];
    let boxNumbers: number[] = [];
    let total = 0;

    if (modelExists) {
      const boxNumbersResult = await db
        .request()
        .input("idOrder", idOrder)
        .input("model", model)
        .input("pageSize", pageSize)
        .input("offset", (page - 1) * pageSize)
        .query(`
          SELECT DISTINCT boxNumber
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
          ORDER BY boxNumber
          OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `);

      boxNumbers = boxNumbersResult.recordset.map((row: any) => row.boxNumber);

      const totalBoxNumbersResult = await db
        .request()
        .input("idOrder", idOrder)
        .input("model", model)
        .query(`
          SELECT COUNT(DISTINCT boxNumber) AS total
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
        `);

      total = totalBoxNumbersResult.recordset[0]?.total || 0;

      if (boxNumbers.length > 0) {
        const inClause = boxNumbers.map((_, i) => `@box${i}`).join(',');
        const request = db.request()
          .input("idOrder", idOrder)
          .input("model", model);
        boxNumbers.forEach((boxNumber, i) => {
          request.input(`box${i}`, boxNumber);
        });

        const resultQuery = await request.query(`
          SELECT idOrder, model, boxNumber,
                 SUM(CAST(newBillableWeight AS FLOAT)) AS newBillableWeight,
                 SUM(CAST(newFreightCost AS FLOAT)) AS newFreightCost,
                 SUM(CAST(newVoidVolume AS FLOAT)) AS newVoidVolume,
                 SUM(CAST(newVoidFillCost AS FLOAT)) AS newVoidFillCost,
                 SUM(CAST(newBoxCorrugateArea AS FLOAT)) / 144 AS newBoxCorrugateArea,
                 SUM(CAST(newBoxCorrugateCost AS FLOAT)) AS newBoxCorrugateCost
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
            AND boxNumber IN (${inClause})
          GROUP BY idOrder, model, boxNumber
          ORDER BY boxNumber
        `);

        results = resultQuery.recordset;
      }
    }

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
      { label: 'Current Number of Boxes Used', value: totalBoxesUsed },
      { label: 'Minimum Number of Boxes to Analyze', value: minBoxNumber },
      { label: 'Maximum Number of Boxes to Analyze', value: maxBoxNumber },
    ];

    let currentResults: any[] = [];
    if (currentModelExists) {
      const currentResultsQuery = await db
        .request()
        .input("idOrder", idOrder)
        .input("model", currentModelName)
        .query(`
          SELECT idOrder, model, boxNumber,
                 SUM(CAST(newBillableWeight AS FLOAT)) AS newBillableWeight,
                 SUM(CAST(newFreightCost AS FLOAT)) AS newFreightCost,
                 SUM(CAST(newVoidVolume AS FLOAT)) AS newVoidVolume,
                 SUM(CAST(newVoidFillCost AS FLOAT)) AS newVoidFillCost,
                 SUM(CAST(newBoxCorrugateArea AS FLOAT)) / 144 AS newBoxCorrugateArea,
                 SUM(CAST(newBoxCorrugateCost AS FLOAT)) AS newBoxCorrugateCost
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
          GROUP BY idOrder, model, boxNumber
          ORDER BY boxNumber
        `);

      currentResults = currentResultsQuery.recordset;
    }

    modelGroups.push({
      model,
      results,
      boxNumbers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      summaryCards,
      totalBoxesUsed,
      minBoxNumber,
      maxBoxNumber,
      [currentModelName]: currentResults
    });
  }

  return { models: modelGroups };
};

export const existsResultsByOrder = async (idOrder: number): Promise<1 | 0> => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");
  const result = await db.request()
    .input("idOrder", idOrder)
    .query("SELECT 1 as existsResult FROM TB_Results WHERE idOrder = @idOrder");
  return result.recordset.length > 0 ? 1 : 0;
};

export const getValidateResultsByOrder = async (idOrder: number): Promise<1 | 0> => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");
  const result = await db.request()
    .input("idOrder", idOrder)
    .query("SELECT 1 as existsResult FROM TB_Results WHERE idOrder = @idOrder");
  return result.recordset.length > 0 ? 1 : 0;
};

// export const runEvenVolumeDinamicoModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const itemsResult = await db.request().input("idOrder", idOrder).query(`
//     SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC
//   `);
//   if (!itemsResult?.recordset?.length) throw new Error("No shipment data found for this order");

//   // const items: ShipmentItem[] = itemsResult.recordset; //descomentar si hay problemas con la normalización

//   // ----
//   // Normalizar ítems si no están normalizados
//   const row = itemsResult.recordset[0];
//   const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;

//   const items: ShipmentItem[] = isNormalized
//     ? itemsResult.recordset
//     : itemsResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

// // ----
//   const attrDataResult = await db.request().input("idOrder", idOrder).query(`
//     SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder
//   `);
//   if (!attrDataResult?.recordset?.length) throw new Error("No attribute data found for this order");
//   const attrData = attrDataResult.recordset[0];

//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed);
//   const dimWeightFactor = attrData.dimWeightFactor;
//   const packMaterialCost = attrData.packMaterialCost;
//   const corrugateCostPerSf = attrData.corrugateCost;
//   const freightCostPerLb = attrData.freightCostPerLb;

//   let numBoxesArray: number[] = [];
//   if (runCurrentBoxKitOnly === 0) {
//     numBoxesArray = Array.from(
//       { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
//       (_, i) => attrData.minimunNumBox + i
//     );
//   }

//   for (const numBoxes of numBoxesArray) {
//     await executeEvenVolumeDinamico(
//       db,
//       items,
//       attrData,
//       idOrder,
//       numBoxes,
//       dimWeightFactor,
//       packMaterialCost,
//       corrugateCostPerSf,
//       freightCostPerLb,
//       "EvenVolumeDynamic"
//     );
//   }

//   const boxKitResult = await db.request().input("idOrder", idOrder).query(`
//     SELECT TOP 1 * FROM TB_BoxKitFile 
//     WHERE idOrder = @idOrder 
//     ORDER BY length DESC
//   `);
//   if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");
//   const box = boxKitResult.recordset[0];

//   await executeEvenVolume(
//     db,
//     items,
//     attrData,
//     idOrder,
//     currentBoxUsed,
//     dimWeightFactor,
//     packMaterialCost,
//     corrugateCostPerSf,
//     freightCostPerLb,
//     "CurrentEvenVolumeDynamic",
//     box.length,
//     box.width,
//     box.height
//   );

//   return {
//     success: true,
//     message: "RunEvenVolumeDynamic model completed successfully (with dynamic volume)"
//   };
// };

// async function executeEvenVolumeDinamico(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   const enrichedItems = items.map(item => ({
//     ...item,
//     itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//   })).sort((a, b) => b.itemVolume - a.itemVolume);

//   const referenceSegments = { large: 7.5, medium: 10, small: 15 };
//   const scale = 10 / numBoxes;
//   const scaled = {
//     large: referenceSegments.large * scale,
//     medium: referenceSegments.medium * scale,
//     small: referenceSegments.small * scale
//   };
//   const numLarge = Math.round(numBoxes * 0.3);
//   const numMedium = Math.round(numBoxes * 0.3);
//   const numSmall = numBoxes - numLarge - numMedium;
//   const scaledPercentages = [
//     ...Array(numLarge).fill(scaled.large),
//     ...Array(numMedium).fill(scaled.medium),
//     ...Array(numSmall).fill(scaled.small)
//   ];

//   const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);
//   const breakpoints = scaledPercentages.map((p, i) =>
//     scaledPercentages.slice(0, i + 1).reduce((a, b) => a + b, 0) / 100 * totalVolume
//   );

//   const segmentStartIndexes: number[] = [0];
//   let accVolume = 0;
//   let currentBox = 0;
//   for (let i = 0; i < enrichedItems.length && currentBox < numBoxes - 1; i++) {
//     accVolume += enrichedItems[i].itemVolume;
//     if (accVolume >= breakpoints[currentBox]) {
//       segmentStartIndexes.push(i + 1);
//       currentBox++;
//     }
//   }
//   segmentStartIndexes.push(enrichedItems.length);

//   const segments: ShipmentItem[][] = [];
//   for (let i = 0; i < numBoxes; i++) {
//     const from = segmentStartIndexes[i];
//     const to = segmentStartIndexes[i + 1];
//     if (to <= from) continue;
//     segments.push(enrichedItems.slice(from, to));
//   }

//   const anchorBox = segments[0];
//   const boxLength = fixedBoxLength ?? Math.max(...anchorBox.map(i => i.cubedItemLength));
//   const boxWidth = fixedBoxWidth ?? Math.max(...anchorBox.map(i => i.cubedItemWidth));
//   const boxHeight = fixedBoxHeight ?? Math.max(...anchorBox.map(i => i.cubedItemHeight));

//   for (let i = 0; i < segments.length; i++) {
//     const segment = segments[i];
//     if (!segment.length) continue;

//     const fromRow = segment[0].id;
//     const toRow = segment[segment.length - 1].id;

//     await db.request()
//       .input("idOrder", idOrder)
//       .input("model", modelName)
//       .input("boxLabel", `Box ${i + 1}`)
//       .input("boxNumber", i + 1)
//       .input("boxLength", boxLength)
//       .input("boxWidth", boxWidth)
//       .input("boxHeight", boxHeight)
//       .input("fromRow", fromRow)
//       .input("toRow", toRow)
//       .input("numBoxes", numBoxes)
//       .query(`
//         INSERT INTO TB_KitBoxes (
//           idOrder, model, boxLabel, boxNumber,
//           boxLength, boxWidth, boxHeight,
//           fromRow, toRow, numBoxes
//         ) VALUES (
//           @idOrder, @model, @boxLabel, @boxNumber,
//           @boxLength, @boxWidth, @boxHeight,
//           @fromRow, @toRow, @numBoxes
//         )
//       `);
//   }

//   const MAX_BATCH_SIZE = 500;
//   const valuesList: string[] = [];

//   for (let i = 0; i < segments.length; i++) {
//     const segment = segments[i];
//     if (!segment.length) continue;

//     for (const item of segment) {
//       const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
//                           item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
//       const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);

//       const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
//       const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

//       const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
//       const newDimWeight = (boxLength * boxWidth * boxHeight) / dimWeightFactor;

//       const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//       const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

//       const currentFreightCost = currentBillableWeight * freightCostPerLb;
//       const newFreightCost = newBillableWeight * freightCostPerLb;

//       const currentVoidVolume = (
//         item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight -
//         item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//       ) / 1728;
//       const newVoidVolume = (
//         boxLength * boxWidth * boxHeight -
//         item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//       ) / 1728;

//       const currentVoidFillCost = currentVoidVolume * packMaterialCost;
//       const newVoidFillCost = newVoidVolume * packMaterialCost;

//       valuesList.push(`(
//         ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
//         ${boxLength}, ${boxWidth}, ${boxHeight},
//         ${currentArea}, ${newArea},
//         ${currentCorrugateCost}, ${newCorrugateCost},
//         ${currentDimWeight}, ${newDimWeight},
//         ${currentBillableWeight}, ${newBillableWeight},
//         ${currentFreightCost}, ${newFreightCost},
//         ${currentVoidVolume}, ${newVoidVolume},
//         ${currentVoidFillCost}, ${newVoidFillCost}
//       )`);
//     }
//   }

//   for (let i = 0; i < valuesList.length; i += MAX_BATCH_SIZE) {
//     const chunk = valuesList.slice(i, i + MAX_BATCH_SIZE);
//     const sql = `
//       INSERT INTO TB_Results (
//         idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//         newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//         currentBoxCorrugateArea, newBoxCorrugateArea,
//         currentBoxCorrugateCost, newBoxCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       )
//       VALUES
//       ${chunk.join(',\n')}
//     `;
//     await db.request().query(sql);
//   }
// }
// async function executeEvenVolumeDinamico(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   if (!items.length) throw new Error("No items to process");

//   const enrichedItems = items.map(item => ({
//     ...item,
//     itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//   })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

//   const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);
//   let cumulativeVolume = 0;
//   enrichedItems.forEach(item => {
//     cumulativeVolume += item.itemVolume;
//     (item as any).cumVolume = cumulativeVolume;
//     (item as any).cumVolumePct = cumulativeVolume / totalVolume;
//   });

//   const boxes1 = Math.round(numBoxes * 0.3);
//   const boxes2 = Math.round(numBoxes * 0.4);
//   const boxes3 = numBoxes - boxes1 - boxes2;

//   const cut1Idx = enrichedItems.findIndex(i => (i as any).cumVolumePct >= boxes1 / numBoxes);
//   const cut2Idx = enrichedItems.findIndex(i => (i as any).cumVolumePct >= (boxes1 + boxes2) / numBoxes);

//   const segment1 = enrichedItems.slice(0, cut1Idx);
//   const segment2 = enrichedItems.slice(cut1Idx, cut2Idx);
//   const segment3 = enrichedItems.slice(cut2Idx);

//   const splitSegment = (segment: typeof enrichedItems, n: number) => {
//     if (n <= 0 || segment.length === 0) return Array(n).fill([]);
//     const avg = Math.ceil(segment.length / n);
//     const result: typeof enrichedItems[] = [];
//     for (let i = 0; i < segment.length; i += avg) {
//       result.push(segment.slice(i, i + avg));
//     }
//     while (result.length < n) result.push([]);
//     return result;
//   };

//   const boxesSegments = [
//     ...splitSegment(segment1, boxes1),
//     ...splitSegment(segment2, boxes2),
//     ...splitSegment(segment3, boxes3)
//   ];

//   for (let i = 0; i < boxesSegments.length; i++) {
//     const seg = boxesSegments[i];
//     const boxLength: number = safeFloat(fixedBoxLength ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemLength)));
//     const boxWidth: number = safeFloat(fixedBoxWidth ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemWidth)));
//     const boxHeight: number = safeFloat(fixedBoxHeight ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemHeight)));

//     await db.request()
//       .input("idOrder", idOrder)
//       .input("boxLabel", `Box ${i + 1}`)
//       .input("boxNumber", numBoxes)
//       .input("boxLength", boxLength)
//       .input("boxWidth", boxWidth)
//       .input("boxHeight", boxHeight)
//       .input("fromRow", 0)
//       .input("toRow", 0)
//       .input("model", modelName)
//       .input("numBoxes", numBoxes)
//       .query(`
//         INSERT INTO TB_KitBoxes (
//           idOrder, boxLabel, boxNumber,
//           boxLength, boxWidth, boxHeight,
//           fromRow, toRow, model, numBoxes
//         )
//         VALUES (
//           @idOrder, @boxLabel, @boxNumber,
//           @boxLength, @boxWidth, @boxHeight,
//           @fromRow, @toRow, @model, @numBoxes
//         )
//       `);
//   }

//   const itemBoxMap = new Map<number, { boxLength: number, boxWidth: number, boxHeight: number }>();
//   for (const seg of boxesSegments) {
//     interface BoxDimensions {
//       boxLength: number;
//       boxWidth: number;
//       boxHeight: number;
//     }
//     const dims: BoxDimensions = {
//       boxLength: safeFloat(fixedBoxLength ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemLength))),
//       boxWidth: safeFloat(fixedBoxWidth ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemWidth))),
//       boxHeight: safeFloat(fixedBoxHeight ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemHeight))),
//     };
//     for (const item of seg) {
//       itemBoxMap.set(item.id, dims);
//     }
//   }

//   const MAX_BATCH_SIZE = 500;
//   const valuesList: string[] = [];

//   for (const item of items) {
//     const dims = itemBoxMap.get(item.id);
//     if (!dims) continue;

//     const { boxLength, boxWidth, boxHeight } = dims;

//     const currentArea = safeFloat(item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)
//       + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));
//     const newArea = safeFloat(boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight));

//     const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
//     const newCorrugateCost = safeFloat((newArea / 144) * corrugateCostPerSf);

//     const currentDimWeight = safeFloat((item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor);
//     const newDimWeight = safeFloat((boxLength * boxWidth * boxHeight) / dimWeightFactor);

//     const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//     const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

//     const currentFreightCost = safeFloat(currentBillableWeight * freightCostPerLb);
//     const newFreightCost = safeFloat(newBillableWeight * freightCostPerLb);

//     const currentVoidVolume = safeFloat((item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight
//       - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728);
//     const newVoidVolume = safeFloat((boxLength * boxWidth * boxHeight
//       - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728);

//     const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
//     const newVoidFillCost = safeFloat(newVoidVolume * packMaterialCost);

//     valuesList.push(`(
//       ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
//       ${boxLength}, ${boxWidth}, ${boxHeight},
//       ${currentArea}, ${newArea},
//       ${currentCorrugateCost}, ${newCorrugateCost},
//       ${currentDimWeight}, ${newDimWeight},
//       ${currentBillableWeight}, ${newBillableWeight},
//       ${currentFreightCost}, ${newFreightCost},
//       ${currentVoidVolume}, ${newVoidVolume},
//       ${currentVoidFillCost}, ${newVoidFillCost}
//     )`);
//   }

//   for (let i = 0; i < valuesList.length; i += MAX_BATCH_SIZE) {
//     const chunk = valuesList.slice(i, i + MAX_BATCH_SIZE);
//     const sql = `
//       INSERT INTO TB_Results (
//         idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//         newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//         currentBoxCorrugateArea, newBoxCorrugateArea,
//         currentBoxCorrugateCost, newBoxCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       )
//       VALUES
//       ${chunk.join(',\n')}
//     `;
//     await db.request().query(sql);
//   }
// }

export const getModelImprovementByIdOrder = async (
  idOrder: number,
  model: "EvenDistribution" | "TopFrequencies" | "EvenVolumeDynamic" | "EvenVolume",
  page: number = 1,
  pageSize: number = 10
) => {
  const db = await connectToSqlServer();
  const currentModel = `Current${model}`;

  const boxNumbersResult = await db?.request()
    .input("idOrder", idOrder)
    .input("model", model)
    .input("pageSize", pageSize)
    .input("offset", (page - 1) * pageSize)
    .query(`
      SELECT DISTINCT boxNumber
      FROM TB_Results
      WHERE idOrder = @idOrder AND model = @model
      ORDER BY boxNumber
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

  const boxNumbers = boxNumbersResult?.recordset?.map((r: any) => r.boxNumber) || [];
  if (!boxNumbers.length) return [];

  const inClause = boxNumbers.map((_, i) => `@box${i}`).join(',');
  const request = db?.request().input("idOrder", idOrder).input("model", model);
  if (request) {
    boxNumbers.forEach((box, i) => {
      request.input(`box${i}`, box);
    });
  } else {
    throw new Error("Database request object is undefined.");
  }

  const optimizedResult = await request.query(`
    SELECT boxNumber,
           SUM(CAST(newBillableWeight AS FLOAT)) AS newBillableWeight,
           SUM(CAST(newFreightCost AS FLOAT)) AS newFreightCost,
           SUM(CAST(newVoidVolume AS FLOAT)) AS newVoidVolume,
           SUM(CAST(newVoidFillCost AS FLOAT)) AS newVoidFillCost,
           SUM(CAST(newBoxCorrugateArea AS FLOAT)) / 144 AS newBoxCorrugateArea,
           SUM(CAST(newBoxCorrugateCost AS FLOAT)) AS newBoxCorrugateCost
    FROM TB_Results
    WHERE idOrder = @idOrder AND model = @model AND boxNumber IN (${inClause})
    GROUP BY boxNumber
    ORDER BY boxNumber
  `);

  const currentTotalResult = await db?.request()
    .input("idOrder", idOrder)
    .input("model", currentModel)
    .query(`
      SELECT
        SUM(CAST(newBillableWeight AS FLOAT)) AS newBillableWeight,
        SUM(CAST(newFreightCost AS FLOAT)) AS newFreightCost,
        SUM(CAST(newVoidVolume AS FLOAT)) AS newVoidVolume,
        SUM(CAST(newVoidFillCost AS FLOAT)) AS newVoidFillCost,
        SUM(CAST(newBoxCorrugateArea AS FLOAT)) / 144 AS newBoxCorrugateArea,
        SUM(CAST(newBoxCorrugateCost AS FLOAT)) AS newBoxCorrugateCost
      FROM TB_Results
      WHERE idOrder = @idOrder AND model = @model
    `);

  if (!currentTotalResult || !currentTotalResult.recordset || !currentTotalResult.recordset[0]) {
    throw new Error(`No current results found for model: ${currentModel}`);
  }
  const current = currentTotalResult.recordset[0];
  if (current.newBillableWeight == null) {
    throw new Error(`No current results found for model: ${currentModel}`);
  }

  const improvements = optimizedResult.recordset.map((box: any) => ({
    boxNumber: box.boxNumber,
    DimensionalWeightImprovement:
      current.newBillableWeight > 0
        ? 1 - (box.newBillableWeight / current.newBillableWeight)
        : 0,
    EstimatedTotalFreightImprovement:
      current.newFreightCost > 0
        ? 1 - (box.newFreightCost / current.newFreightCost)
        : 0,
    VoidVolumeImprovement:
      current.newVoidVolume > 0
        ? 1 - (box.newVoidVolume / current.newVoidVolume)
        : 0,
    VoidFillCostImprovement:
      current.newVoidFillCost > 0
        ? 1 - (box.newVoidFillCost / current.newVoidFillCost)
        : 0,
    CorrugateAreaImprovement:
      current.newBoxCorrugateArea > 0
        ? 1 - (box.newBoxCorrugateArea / current.newBoxCorrugateArea)
        : 0,
    CorrugateCostImprovement:
      current.newBoxCorrugateCost > 0
        ? 1 - (box.newBoxCorrugateCost / current.newBoxCorrugateCost)
        : 0,
  }));

  return improvements;
};

export const getBoxDimensionsByOrderAndModel = async (
  idOrder: number,
  model:
    | "EvenDistribution"
    | "TopFrequencies"
    | "EvenVolumeDynamic"
    | "EvenVolume",
  numBoxes?: number
) => {
  const db = await connectToSqlServer();

  const numBoxesCondition = numBoxes !== undefined ? " AND numBoxes = @numBoxes" : "";

  let request = db?.request()
    .input("idOrder", idOrder)
    .input("model", model);

  if (numBoxes !== undefined) {
    request?.input("numBoxes", numBoxes);
  }

  let result = await request?.query(`
    SELECT DISTINCT boxLabel, model, boxNumber,
      CAST(boxLength AS FLOAT) AS boxLength,
      CAST(boxWidth AS FLOAT) AS boxWidth,
      CAST(boxHeight AS FLOAT) AS boxHeight
    FROM TB_KitBoxes
    WHERE idOrder = @idOrder AND model = @model${numBoxesCondition}
    ORDER BY boxLength DESC, boxWidth DESC, boxHeight DESC
  `);

  if (!result?.recordset?.length) {
    const currentModel = `Current${model}`;
    let currentRequest = db?.request()
      .input("idOrder", idOrder)
      .input("model", currentModel);

    if (numBoxes !== undefined) {
      currentRequest?.input("numBoxes", numBoxes);
    }

    result = await currentRequest?.query(`
      SELECT DISTINCT boxLabel, model, boxNumber,
        CAST(boxLength AS FLOAT) AS boxLength,
        CAST(boxWidth AS FLOAT) AS boxWidth,
        CAST(boxHeight AS FLOAT) AS boxHeight
      FROM TB_KitBoxes
      WHERE idOrder = @idOrder AND model = @model${numBoxesCondition}
      ORDER BY boxLength DESC, boxWidth DESC, boxHeight DESC
    `);
  }

  return result?.recordset || [];
};

export function applyAABBHeuristic(row: any): ShipmentItem[] {
  const MAX_ITEMS = 5;
  const rawItems = [];

  for (let i = 1; i <= MAX_ITEMS; i++) {
    const length = parseFloat(row[`item${i}Length`]);
    const width = parseFloat(row[`item${i}Width`]);
    const height = parseFloat(row[`item${i}Height`]);
    const weight = parseFloat(row[`item${i}Weight`]);

    if ([length, width, height, weight].every(v => !isNaN(v) && v > 0)) {
      rawItems.push({ length, width, height, weight });
    }
  }

  if (rawItems.length === 0) return [];

  const box = computeHeuristicAABBShippingBox(rawItems);
  if (!box) return [];

  return [{
    cubedItemLength: box.length,
    cubedItemWidth: box.width,
    cubedItemHeight: box.height,
    cubedItemWeight: rawItems.reduce((acc, i) => acc + i.weight, 0) / rawItems.length,
    currentAssignedBoxLength: box.length,
    currentAssignedBoxWidth: box.width,
    currentAssignedBoxHeight: box.height,
    id: row.id,
    cubingMethod: box.method,
  }];
}
// export const runTopFrequenciesModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const shipmentResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder`);

//   if (!shipmentResult?.recordset?.length) {
//     throw new Error("No shipment data found for this order");
//   }

//   const row = shipmentResult.recordset[0];

//   // Ajuste clave: validar por null, no solo existencia de campo
//   const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;

//   const items: ShipmentItem[] = isNormalized
//     ? shipmentResult.recordset
//     : shipmentResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

//   const attrDataResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);

//   if (!attrDataResult?.recordset?.length)
//     throw new Error("No attribute data found for this order");

//   const attrData = attrDataResult.recordset[0];
//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed);
//   const dimWeightFactor = attrData.dimWeightFactor;
//   const packMaterialCost = attrData.packMaterialCost;
//   const corrugateCostPerSf = attrData.corrugateCost;
//   const freightCostPerLb = attrData.freightCostPerLb;

//   const minBoxes = Number(attrData.minimunNumBox);
//   const maxBoxes = Number(attrData.maximunNumBox);

//   const boxRange = runCurrentBoxKitOnly === 0
//     ? Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i)
//     : [];

//   for (const numBoxes of boxRange) {
//     const modelName = `TopFrequencies`;
//     await executeTopFrequenciesModel(
//       db,
//       items,
//       attrData,
//       idOrder,
//       numBoxes,
//       dimWeightFactor,
//       packMaterialCost,
//       corrugateCostPerSf,
//       freightCostPerLb,
//       modelName
//     );
//   }

//   const boxKitResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`
//       SELECT TOP 1 * FROM TB_BoxKitFile 
//       WHERE idOrder = @idOrder 
//       ORDER BY length DESC
//     `);

//   if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");

//   const box = boxKitResult.recordset[0];
//   const modelName = `CurrentTopFrequencies`;

//   await executeTopFrequenciesModel(
//     db,
//     items,
//     attrData,
//     idOrder,
//     currentBoxUsed,
//     dimWeightFactor,
//     packMaterialCost,
//     corrugateCostPerSf,
//     freightCostPerLb,
//     modelName,
//     box.length,
//     box.width,
//     box.height
//   );

//   return {
//     success: true,
//     message: "TopFrequencies model completed successfully"
//   };
// };

// export async function executeTopFrequenciesModel(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   const enrichedItems = items.map(item => ({
//     ...item,
//     volume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//   }));

//   const sortedItems = enrichedItems.sort((a, b) => b.cubedItemLength - a.cubedItemLength);

//   const lengthCounts: Record<number, number> = {};
//   for (const item of sortedItems) {
//     lengthCounts[item.cubedItemLength] = (lengthCounts[item.cubedItemLength] || 0) + 1;
//   }

//   const sortedFrequencies = Object.entries(lengthCounts)
//     .map(([length, freq]) => ({ length: parseFloat(length), freq }))
//     .sort((a, b) => b.freq - a.freq || b.length - a.length);

//   const topLengths = sortedFrequencies
//     .slice(0, numBoxes - 1)
//     .map(entry => entry.length)
//     .sort((a, b) => b - a);

//   const cutPoints: number[] = [];
//   for (const length of topLengths) {
//     const index = sortedItems.findIndex(item => item.cubedItemLength === length);
//     if (index !== -1) cutPoints.push(index);
//   }
//   cutPoints.push(sortedItems.length);

//   const segments: ShipmentItem[][] = [];
//   let start = 0;
//   for (const end of cutPoints) {
//     segments.push(sortedItems.slice(start, end));
//     start = end;
//   }

//   for (let i = 0; i < segments.length; i++) {
//     const segmentItems = segments[i];
//     const fromRow = segmentItems.length > 0 ? items.indexOf(segmentItems[0]) + 1 : 0;
//     const toRow = segmentItems.length > 0 ? items.indexOf(segmentItems[segmentItems.length - 1]) + 1 : 0;

//     const boxLength = fixedBoxLength ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(item => item.cubedItemLength)) : 1);
//     const boxWidth = fixedBoxWidth ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(item => item.cubedItemWidth)) : 1);
//     const boxHeight = fixedBoxHeight ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(item => item.cubedItemHeight)) : 1);

//     const boxLabel = `Box ${i + 1}`;
//     const boxNumber = numBoxes;

//     await db.request()
//       .input("idOrder", idOrder)
//       .input("boxLabel", boxLabel)
//       .input("boxNumber", boxNumber)
//       .input("boxLength", boxLength)
//       .input("boxWidth", boxWidth)
//       .input("boxHeight", boxHeight)
//       .input("fromRow", fromRow)
//       .input("toRow", toRow)
//       .input("model", modelName)
//       .input("numBoxes", numBoxes)
//       .query(`
//         INSERT INTO TB_KitBoxes (
//           idOrder, boxLabel, boxNumber,
//           boxLength, boxWidth, boxHeight,
//           fromRow, toRow, model, numBoxes
//         )
//         VALUES (
//           @idOrder, @boxLabel, @boxNumber,
//           @boxLength, @boxWidth, @boxHeight,
//           @fromRow, @toRow, @model, @numBoxes
//         )
//       `);
//   }

//   const MAX_BATCH_SIZE = 500;
//   const valuesList: string[] = [];

//   for (let i = 0; i < segments.length; i++) {
//     const segmentItems = segments[i];
//     if (!segmentItems.length) continue;

//     const boxLength = fixedBoxLength ?? Math.max(...segmentItems.map(item => item.cubedItemLength));
//     const boxWidth = fixedBoxWidth ?? Math.max(...segmentItems.map(item => item.cubedItemWidth));
//     const boxHeight = fixedBoxHeight ?? Math.max(...segmentItems.map(item => item.cubedItemHeight));
//     const boxNumber = numBoxes;

//     for (const item of segmentItems) {
//       const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)
//         + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
//       const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);

//       const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
//       const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

//       const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
//       const newDimWeight = (boxLength * boxWidth * boxHeight) / dimWeightFactor;

//       const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//       const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

//       const currentFreightCost = currentBillableWeight * freightCostPerLb;
//       const newFreightCost = newBillableWeight * freightCostPerLb;

//       const currentVoidVolume = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight
//         - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;
//       const newVoidVolume = (boxLength * boxWidth * boxHeight
//         - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;

//       const currentVoidFillCost = currentVoidVolume * packMaterialCost;
//       const newVoidFillCost = newVoidVolume * packMaterialCost;

//       valuesList.push(`(
//         ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${boxNumber},
//         ${boxLength}, ${boxWidth}, ${boxHeight},
//         ${currentArea}, ${newArea},
//         ${currentCorrugateCost}, ${newCorrugateCost},
//         ${currentDimWeight}, ${newDimWeight},
//         ${currentBillableWeight}, ${newBillableWeight},
//         ${currentFreightCost}, ${newFreightCost},
//         ${currentVoidVolume}, ${newVoidVolume},
//         ${currentVoidFillCost}, ${newVoidFillCost}
//       )`);
//     }
//   }

//   for (let i = 0; i < valuesList.length; i += MAX_BATCH_SIZE) {
//     const chunk = valuesList.slice(i, i + MAX_BATCH_SIZE);
//     const sql = `
//       INSERT INTO TB_Results (
//         idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//         newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//         currentBoxCorrugateArea, newBoxCorrugateArea,
//         currentBoxCorrugateCost, newBoxCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       )
//       VALUES
//       ${chunk.join(',\n')}
//     `;
//     await db.request().query(sql);
//   }
// }

function computeHeuristicAABBShippingBox(items: { length: number, width: number, height: number }[]): { length: number, width: number, height: number, volume: number, method: string } | null {
  const computeAABB = (arr: any[]) => {
    const minX = Math.min(...arr.map(i => i.x));
    const minY = Math.min(...arr.map(i => i.y));
    const minZ = Math.min(...arr.map(i => i.z));
    const maxX = Math.max(...arr.map(i => i.x + i.length));
    const maxY = Math.max(...arr.map(i => i.y + i.width));
    const maxZ = Math.max(...arr.map(i => i.z + i.height));

    return {
      length: maxX - minX,
      width: maxY - minY,
      height: maxZ - minZ,
      volume: (maxX - minX) * (maxY - minY) * (maxZ - minZ),
    };
  };

  let bestBox = null;
  let bestVolume = Infinity;
  let bestMethod = "";

  // Linear Y
  let yPos = 0;
  const linearY = items.map(item => {
    const placed = { ...item, x: 0, y: yPos, z: 0 };
    yPos += item.width;
    return placed;
  });
  let box = computeAABB(linearY);
  bestBox = box;
  bestVolume = box.volume;
  bestMethod = "linearY";

  // Linear Z
  let zPos = 0;
  const linearZ = items.map(item => {
    const placed = { ...item, x: 0, y: 0, z: zPos };
    zPos += item.height;
    return placed;
  });
  box = computeAABB(linearZ);
  if (box.volume < bestVolume) {
    bestBox = box;
    bestVolume = box.volume;
    bestMethod = "linearZ";
  }

  // Grid 2x2
  const grid: any[] = [];
  if (items.length >= 1) grid.push({ ...items[0], x: 0, y: 0, z: 0 });
  if (items.length >= 2) grid.push({ ...items[1], x: items[0].length, y: 0, z: 0 });
  if (items.length >= 3) grid.push({ ...items[2], x: 0, y: items[0].width, z: 0 });
  if (items.length >= 4) grid.push({ ...items[3], x: items[0].length, y: items[1].width, z: 0 });

  if (grid.length > 0) {
    box = computeAABB(grid);
    if (box.volume < bestVolume) {
      bestBox = box;
      bestVolume = box.volume;
      bestMethod = "2x2Grid";
    }
  }

  return bestBox ? { ...bestBox, method: bestMethod } : null;
}

// export const runEvenDistributionModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const shipmentResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC`);

//   if (!shipmentResult?.recordset?.length) {
//     throw new Error("No shipment data found for this order");
//   }

//   const row = shipmentResult.recordset[0];
//   const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;

//   const items: ShipmentItem[] = isNormalized
//     ? shipmentResult.recordset
//     : shipmentResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

//   // Leer atributos
//   const attrDataResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
//   if (!attrDataResult?.recordset?.length) throw new Error("No attribute data found for this order");
//   const attrData = attrDataResult.recordset[0];

//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed);
//   const dimWeightFactor = attrData.dimWeightFactor;
//   const packMaterialCost = attrData.packMaterialCost;
//   const corrugateCostPerSf = attrData.corrugateCost;
//   const freightCostPerLb = attrData.freightCostPerLb;

//   const minBoxes = Number(attrData.minimunNumBox);
//   const maxBoxes = Number(attrData.maximunNumBox);

//   const boxRange = runCurrentBoxKitOnly === 0
//     ? Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i)
//     : [];

//   for (const numBoxes of boxRange) {
//     await executeDistributionModel(
//       db,
//       items,
//       attrData,
//       idOrder,
//       numBoxes,
//       dimWeightFactor,
//       packMaterialCost,
//       corrugateCostPerSf,
//       freightCostPerLb,
//       "EvenDistribution"
//     );
//   }

//   const boxKitResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT TOP 1 * FROM TB_BoxKitFile WHERE idOrder = @idOrder ORDER BY length DESC`);
//   if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");
//   const box = boxKitResult.recordset[0];

//   await executeDistributionModel(
//     db,
//     items,
//     attrData,
//     idOrder,
//     currentBoxUsed,
//     dimWeightFactor,
//     packMaterialCost,
//     corrugateCostPerSf,
//     freightCostPerLb,
//     "CurrentEvenDistribution",
//     box.length,
//     box.width,
//     box.height
//   );

//   return {
//     success: true,
//     message: "Even Distribution model completed successfully"
//   };
// };

// export async function executeDistributionModel(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   if (!items.length) throw new Error("No items to process for distribution");

//   const realBoundaries: { start: number; end: number }[] = [];

//   if (fixedBoxLength !== undefined) {
//     realBoundaries.push({ start: 0, end: items.length - 1 });
//   } else {
//     const totalRows = items.length;
//     const targetRowsPerBox = totalRows / numBoxes;
//     let startIdx = 0;

//     for (let i = 0; i < numBoxes; i++) {
//       let endIdx: number;

//       if (i === numBoxes - 1) {
//         endIdx = totalRows - 1;
//       } else {
//         let targetRowIdx = Math.floor(targetRowsPerBox * (i + 1));
//         if (targetRowIdx >= totalRows) targetRowIdx = totalRows - 1;

//         const targetLength = items[targetRowIdx].cubedItemLength;
//         const firstMatchIdx = items.findIndex(it => it.cubedItemLength === targetLength);

//         endIdx = Math.max(firstMatchIdx - 1, startIdx);
//       }

//       realBoundaries.push({ start: startIdx, end: endIdx });
//       startIdx = endIdx + 1;
//     }
//   }

//   const kitBoundaries: { start: number; end: number }[] = [...realBoundaries];
//   while (kitBoundaries.length < numBoxes) {
//     kitBoundaries.push(kitBoundaries[kitBoundaries.length - 1]);
//   }

//   for (let i = 0; i < numBoxes; i++) {
//     const b = kitBoundaries[i];
//     const segmentItems = items.slice(b.start, b.end + 1);

//     const fromRow = segmentItems.length > 0 ? b.start + 1 : 0;
//     const toRow = segmentItems.length > 0 ? b.end + 1 : 0;

//     const boxLength = fixedBoxLength ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemLength)) : 1);
//     const boxWidth = fixedBoxWidth ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemWidth)) : 1);
//     const boxHeight = fixedBoxHeight ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemHeight)) : 1);

//     const boxLabel = `Box ${i + 1}`;
//     const boxNumber = numBoxes;

//     await db.request()
//       .input("idOrder", idOrder)
//       .input("boxLabel", boxLabel)
//       .input("boxNumber", boxNumber)
//       .input("boxLength", boxLength)
//       .input("boxWidth", boxWidth)
//       .input("boxHeight", boxHeight)
//       .input("fromRow", fromRow)
//       .input("toRow", toRow)
//       .input("model", modelName)
//       .input("numBoxes", numBoxes)
//       .query(`
//         INSERT INTO TB_KitBoxes (
//           idOrder, boxLabel, boxNumber,
//           boxLength, boxWidth, boxHeight,
//           fromRow, toRow, model, numBoxes
//         )
//         VALUES (
//           @idOrder, @boxLabel, @boxNumber,
//           @boxLength, @boxWidth, @boxHeight,
//           @fromRow, @toRow, @model, @numBoxes
//         )
//       `);
//   }

//   const MAX_BATCH_SIZE = 500;
//   const valuesList: string[] = [];

//   for (const [index, boundary] of realBoundaries.entries()) {
//     const segmentItems = items.slice(boundary.start, boundary.end + 1);
//     if (!segmentItems.length) continue;

//     const boxLength = fixedBoxLength ?? Math.max(...segmentItems.map(it => it.cubedItemLength));
//     const boxWidth = fixedBoxWidth ?? Math.max(...segmentItems.map(it => it.cubedItemWidth));
//     const boxHeight = fixedBoxHeight ?? Math.max(...segmentItems.map(it => it.cubedItemHeight));
//     const boxNumber = numBoxes;

//     for (const item of segmentItems) {
//       const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)
//         + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
//       const newArea = (boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight));

//       const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
//       const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

//       const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
//       const newDimWeight = (boxLength * boxWidth * boxHeight) / dimWeightFactor;

//       const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//       const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

//       const currentFreightCost = currentBillableWeight * freightCostPerLb;
//       const newFreightCost = newBillableWeight * freightCostPerLb;

//       const currentVoidVolume = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight
//         - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;
//       const newVoidVolume = (boxLength * boxWidth * boxHeight
//         - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;

//       const currentVoidFillCost = currentVoidVolume * packMaterialCost;
//       const newVoidFillCost = newVoidVolume * packMaterialCost;

//       valuesList.push(`(
//         ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${boxNumber},
//         ${boxLength}, ${boxWidth}, ${boxHeight},
//         ${currentArea}, ${newArea},
//         ${currentCorrugateCost}, ${newCorrugateCost},
//         ${currentDimWeight}, ${newDimWeight},
//         ${currentBillableWeight}, ${newBillableWeight},
//         ${currentFreightCost}, ${newFreightCost},
//         ${currentVoidVolume}, ${newVoidVolume},
//         ${currentVoidFillCost}, ${newVoidFillCost}
//       )`);
//     }
//   }

//   for (let i = 0; i < valuesList.length; i += MAX_BATCH_SIZE) {
//     const chunk = valuesList.slice(i, i + MAX_BATCH_SIZE);
//     const sql = `
//       INSERT INTO TB_Results (
//         idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//         newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//         currentBoxCorrugateArea, newBoxCorrugateArea,
//         currentBoxCorrugateCost, newBoxCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       )
//       VALUES
//       ${chunk.join(',\n')}
//     `;

//     await db.request().query(sql);
//   }
// }

// export const runEvenVolumeModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const shipmentResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC`);

//   if (!shipmentResult?.recordset?.length) {
//     throw new Error("No shipment data found for this order");
//   }

//   const row = shipmentResult.recordset[0];
//   const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;

//   const items: ShipmentItem[] = isNormalized
//     ? shipmentResult.recordset
//     : shipmentResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

//   const attrDataResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
//   if (!attrDataResult?.recordset?.length) throw new Error("No attribute data found for this order");
//   const attrData = attrDataResult.recordset[0];

//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed);
//   const dimWeightFactor = attrData.dimWeightFactor;
//   const packMaterialCost = attrData.packMaterialCost;
//   const corrugateCostPerSf = attrData.corrugateCost;
//   const freightCostPerLb = attrData.freightCostPerLb;

//   const minBoxes = Number(attrData.minimunNumBox);
//   const maxBoxes = Number(attrData.maximunNumBox);

//   const boxRange = runCurrentBoxKitOnly === 0
//     ? Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i)
//     : [];

//   for (const numBoxes of boxRange) {
//     await executeEvenVolume(
//       db,
//       items,
//       attrData,
//       idOrder,
//       numBoxes,
//       dimWeightFactor,
//       packMaterialCost,
//       corrugateCostPerSf,
//       freightCostPerLb,
//       "EvenVolume"
//     );
//   }

//   const boxKitResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT TOP 1 * FROM TB_BoxKitFile WHERE idOrder = @idOrder ORDER BY length DESC`);
//   if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");
//   const box = boxKitResult.recordset[0];

//   await executeEvenVolume(
//     db,
//     items,
//     attrData,
//     idOrder,
//     currentBoxUsed,
//     dimWeightFactor,
//     packMaterialCost,
//     corrugateCostPerSf,
//     freightCostPerLb,
//     "CurrentEvenVolume",
//     box.length,
//     box.width,
//     box.height
//   );

//   return {
//     success: true,
//     message: "RunEvenVolume model completed successfully"
//   };
// };

// async function executeEvenVolume(
//   db: any,
//   items: ShipmentItem[],
//   attrData: any,
//   idOrder: number,
//   numBoxes: number,
//   dimWeightFactor: number,
//   packMaterialCost: number,
//   corrugateCostPerSf: number,
//   freightCostPerLb: number,
//   modelName: string,
//   fixedBoxLength?: number,
//   fixedBoxWidth?: number,
//   fixedBoxHeight?: number
// ) {
//   if (!items.length) throw new Error("No items to process");

//   type EnrichedItem = ShipmentItem & {
//     itemVolume: number;
//     cumulativeVolume?: number;
//     cumulativePercentage?: number;
//   };
//   const enrichedItems: EnrichedItem[] = items.map(item => ({
//     ...item,
//     itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
//   })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

//   const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);

//   let cumulativeVolume = 0;
//   enrichedItems.forEach((item, idx) => {
//     cumulativeVolume += item.itemVolume;
//     item.cumulativeVolume = cumulativeVolume;
//     item.cumulativePercentage = cumulativeVolume / totalVolume;
//   });

//   const cutPoints: number[] = [];
//   const volumeTargets = Array.from({ length: numBoxes - 1 }, (_, i) => (i + 1) / numBoxes);

//   for (const target of volumeTargets) {
//     const passedIdx = enrichedItems.findIndex(it => (it.cumulativePercentage ?? 0) >= target);
//     if (passedIdx === -1) continue;
//     const anchorLength = enrichedItems[passedIdx].cubedItemLength;
//     const trueCutIndex = enrichedItems.findIndex(it => it.cubedItemLength === anchorLength);
//     cutPoints.push(trueCutIndex);
//   }
//   cutPoints.push(enrichedItems.length);

//   const segments: ShipmentItem[][] = [];
//   let start = 0;
//   for (const end of cutPoints) {
//     const segment = enrichedItems.slice(start, end);
//     segments.push(segment);
//     start = end;
//   }

//   for (let i = 0; i < segments.length; i++) {
//     const segItems = segments[i];
//     const boxLength = safeFloat(fixedBoxLength ?? Math.max(...segItems.map(it => it.cubedItemLength)));
//     const boxWidth = safeFloat(fixedBoxWidth ?? Math.max(...segItems.map(it => it.cubedItemWidth)));
//     const boxHeight = safeFloat(fixedBoxHeight ?? Math.max(...segItems.map(it => it.cubedItemHeight)));

//     await db.request()
//       .input("idOrder", idOrder)
//       .input("boxLabel", `Box ${i + 1}`)
//       .input("boxNumber", numBoxes)
//       .input("boxLength", boxLength)
//       .input("boxWidth", boxWidth)
//       .input("boxHeight", boxHeight)
//       .input("fromRow", 0)
//       .input("toRow", 0)
//       .input("model", modelName)
//       .input("numBoxes", numBoxes)
//       .query(`
//         INSERT INTO TB_KitBoxes (
//           idOrder, boxLabel, boxNumber,
//           boxLength, boxWidth, boxHeight,
//           fromRow, toRow, model, numBoxes
//         )
//         VALUES (
//           @idOrder, @boxLabel, @boxNumber,
//           @boxLength, @boxWidth, @boxHeight,
//           @fromRow, @toRow, @model, @numBoxes
//         )
//       `);
//   }

//   const uniqueItemMap = new Map<number, { boxLength: number; boxWidth: number; boxHeight: number }>();
//   for (const item of items) {
//     let foundSegment: ShipmentItem[] | undefined;
//     for (const seg of segments) {
//       if (seg.some(s => s.id === item.id)) {
//         foundSegment = seg;
//         break;
//       }
//     }
//     if (!foundSegment) continue;

//     const boxLength = safeFloat(fixedBoxLength ?? Math.max(...foundSegment.map(it => it.cubedItemLength)));
//     const boxWidth = safeFloat(fixedBoxWidth ?? Math.max(...foundSegment.map(it => it.cubedItemWidth)));
//     const boxHeight = safeFloat(fixedBoxHeight ?? Math.max(...foundSegment.map(it => it.cubedItemHeight)));

//     uniqueItemMap.set(item.id, { boxLength, boxWidth, boxHeight });
//   }

//   const MAX_BATCH_SIZE = 500;
//   const valuesList: string[] = [];

//   for (const item of items) {
//     const boxDims = uniqueItemMap.get(item.id);
//     if (!boxDims) continue;

//     const { boxLength, boxWidth, boxHeight } = boxDims;

//       //const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
//       //                    item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
//       const currentArea =   2*(item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) )+
//                           2*(item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));               
//       //const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);
//       const newArea = 2*(boxLength * (boxWidth + boxHeight) )+ 2*(boxWidth * (boxWidth + boxHeight));

//     const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
//     const newCorrugateCost = safeFloat((newArea / 144) * corrugateCostPerSf);

//     const currentDimWeight = safeFloat((item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor);
//     const newDimWeight = safeFloat((boxLength * boxWidth * boxHeight) / dimWeightFactor);

//     const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//     const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

//     const currentFreightCost = safeFloat(currentBillableWeight * freightCostPerLb);
//     const newFreightCost = safeFloat(newBillableWeight * freightCostPerLb);

//     const currentVoidVolume = safeFloat((item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight
//       - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728);
//     const newVoidVolume = safeFloat((boxLength * boxWidth * boxHeight
//       - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728);

//     const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
//     const newVoidFillCost = safeFloat(newVoidVolume * packMaterialCost);

//     valuesList.push(`(
//       ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
//       ${boxLength}, ${boxWidth}, ${boxHeight},
//       ${currentArea}, ${newArea},
//       ${currentCorrugateCost}, ${newCorrugateCost},
//       ${currentDimWeight}, ${newDimWeight},
//       ${currentBillableWeight}, ${newBillableWeight},
//       ${currentFreightCost}, ${newFreightCost},
//       ${currentVoidVolume}, ${newVoidVolume},
//       ${currentVoidFillCost}, ${newVoidFillCost}
//     )`);
//   }

//   for (let i = 0; i < valuesList.length; i += MAX_BATCH_SIZE) {
//     const chunk = valuesList.slice(i, i + MAX_BATCH_SIZE);
//     const sql = `
//       INSERT INTO TB_Results (
//         idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//         newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//         currentBoxCorrugateArea, newBoxCorrugateArea,
//         currentBoxCorrugateCost, newBoxCorrugateCost,
//         currentDimWeight, newDimWeight,
//         currentBillableWeight, newBillableWeight,
//         currentFreightCost, newFreightCost,
//         currentVoidVolume, newVoidVolume,
//         currentVoidFillCost, newVoidFillCost
//       )
//       VALUES
//       ${chunk.join(',\n')}
//     `;
//     await db.request().query(sql);
//   }
// }
async function executeEvenVolume(
  db: any,
  items: ShipmentItem[],
  attrData: any,
  idOrder: number,
  numBoxes: number,
  dimWeightFactor: number,
  packMaterialCost: number,
  corrugateCostPerSf: number,
  freightCostPerLb: number,
  modelName: string,
  fixedBoxLength?: number,
  fixedBoxWidth?: number,
  fixedBoxHeight?: number
) {
  if (!items.length) throw new Error("No items to process");

  type EnrichedItem = ShipmentItem & {
    itemVolume: number;
    cumulativeVolume?: number;
    cumulativePercentage?: number;
  };

  const enrichedItems: EnrichedItem[] = items.map(item => ({
    ...item,
    itemVolume: safeFloat(item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
  })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

  const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);

  let cumulativeVolume = 0;
  enrichedItems.forEach(item => {
    cumulativeVolume += item.itemVolume;
    item.cumulativeVolume = cumulativeVolume;
    item.cumulativePercentage = cumulativeVolume / totalVolume;
  });

  const cutPoints: number[] = [];
  const volumeTargets = Array.from({ length: numBoxes - 1 }, (_, i) => (i + 1) / numBoxes);

  for (const target of volumeTargets) {
    const passedIdx = enrichedItems.findIndex(it => (it.cumulativePercentage ?? 0) >= target);
    if (passedIdx === -1) continue;
    const anchorLength = enrichedItems[passedIdx].cubedItemLength;
    const trueCutIndex = enrichedItems.findIndex(it => it.cubedItemLength === anchorLength);
    cutPoints.push(trueCutIndex);
  }
  cutPoints.push(enrichedItems.length);

  const segments: ShipmentItem[][] = [];
  let start = 0;
  for (const end of cutPoints) {
    const segment = enrichedItems.slice(start, end);
    segments.push(segment);
    start = end;
  }

  for (let i = 0; i < segments.length; i++) {
    const segItems = segments[i];
    const boxLength = safeFloat(fixedBoxLength ?? Math.max(...segItems.map(it => it.cubedItemLength)));
    const boxWidth = safeFloat(fixedBoxWidth ?? Math.max(...segItems.map(it => it.cubedItemWidth)));
    const boxHeight = safeFloat(fixedBoxHeight ?? Math.max(...segItems.map(it => it.cubedItemHeight)));

    if (!Number.isFinite(boxLength) || !Number.isFinite(boxWidth) || !Number.isFinite(boxHeight)) {
      throw new Error(`Invalid box dimensions: ${boxLength}x${boxWidth}x${boxHeight}`);
    }

    await db.request()
      .input("idOrder", idOrder)
      .input("boxLabel", `Box ${i + 1}`)
      .input("boxNumber", numBoxes)
      .input("boxLength", boxLength)
      .input("boxWidth", boxWidth)
      .input("boxHeight", boxHeight)
      .input("fromRow", 0)
      .input("toRow", 0)
      .input("model", modelName)
      .input("numBoxes", numBoxes)
      .query(`
        INSERT INTO TB_KitBoxes (
          idOrder, boxLabel, boxNumber,
          boxLength, boxWidth, boxHeight,
          fromRow, toRow, model, numBoxes
        )
        VALUES (
          @idOrder, @boxLabel, @boxNumber,
          @boxLength, @boxWidth, @boxHeight,
          @fromRow, @toRow, @model, @numBoxes
        )
      `);
  }

  const uniqueItemMap = new Map<number, { boxLength: number; boxWidth: number; boxHeight: number }>();
  for (const item of items) {
    let foundSegment: ShipmentItem[] | undefined;
    for (const seg of segments) {
      if (seg.some(s => s.id === item.id)) {
        foundSegment = seg;
        break;
      }
    }
    if (!foundSegment) continue;

    const boxLength = safeFloat(fixedBoxLength ?? Math.max(...foundSegment.map(it => it.cubedItemLength)));
    const boxWidth = safeFloat(fixedBoxWidth ?? Math.max(...foundSegment.map(it => it.cubedItemWidth)));
    const boxHeight = safeFloat(fixedBoxHeight ?? Math.max(...foundSegment.map(it => it.cubedItemHeight)));

    uniqueItemMap.set(item.id, { boxLength, boxWidth, boxHeight });
  }

  const MAX_BATCH_SIZE = 500;
  const valuesList: string[] = [];

  for (const item of items) {
    const boxDims = uniqueItemMap.get(item.id);
    if (!boxDims) continue;

    const { boxLength, boxWidth, boxHeight } = boxDims;

    const currentArea = safeFloat(
      2 * item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
      2 * item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth)
    );
    const newArea = safeFloat(
      2 * boxLength * (boxWidth + boxHeight) +
      2 * boxWidth * (boxWidth + boxHeight)
    );

    const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
    const newCorrugateCost = safeFloat((newArea / 144) * corrugateCostPerSf);

    const currentDimWeight = safeFloat((item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor);
    const newDimWeight = safeFloat((boxLength * boxWidth * boxHeight) / dimWeightFactor);

    const currentBillableWeight = safeFloat(Math.max(item.cubedItemWeight, currentDimWeight));
    const newBillableWeight = safeFloat(Math.max(item.cubedItemWeight, newDimWeight));

    const currentVoidVolume = safeFloat((item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight
      - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728);
    const newVoidVolume = safeFloat((boxLength * boxWidth * boxHeight
      - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728);
          const currentFreightCost = currentBillableWeight * freightCostPerLb;
      const newFreightCost = newBillableWeight * freightCostPerLb;

    const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
    const newVoidFillCost = safeFloat(newVoidVolume * packMaterialCost);

    valuesList.push(`(
      ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
      ${boxLength}, ${boxWidth}, ${boxHeight},
      ${currentArea}, ${newArea},
      ${currentCorrugateCost}, ${newCorrugateCost},
      ${currentDimWeight}, ${newDimWeight},
      ${currentBillableWeight}, ${newBillableWeight},
      ${currentFreightCost}, ${newFreightCost},
      ${currentVoidVolume}, ${newVoidVolume},
      ${currentVoidFillCost}, ${newVoidFillCost}
    )`);
  }

  for (let i = 0; i < valuesList.length; i += MAX_BATCH_SIZE) {
    const chunk = valuesList.slice(i, i + MAX_BATCH_SIZE);
    const sql = `
      INSERT INTO TB_Results (
        idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
        newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
        currentBoxCorrugateArea, newBoxCorrugateArea,
        currentBoxCorrugateCost, newBoxCorrugateCost,
        currentDimWeight, newDimWeight,
        currentBillableWeight, newBillableWeight,
        currentFreightCost, newFreightCost,
        currentVoidVolume, newVoidVolume,
        currentVoidFillCost, newVoidFillCost
      )
      VALUES
      ${chunk.join(',\n')}
    `;
    await db.request().query(sql);
  }
}

function safeFloat(value: any, decimals = 2): number {
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num)) return 0;
  return parseFloat(num.toFixed(decimals));
}

//modelos para optimizar tiempo de ejecución
// export const runEvenVolumeDinamicoModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const itemsResult = await db.request().input("idOrder", idOrder).query(`
//     SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC
//   `);
//   if (!itemsResult?.recordset?.length) throw new Error("No shipment data found for this order");

//   const row = itemsResult.recordset[0];
//   const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;
//   const items: ShipmentItem[] = isNormalized
//     ? itemsResult.recordset
//     : itemsResult.recordset.flatMap(applyAABBHeuristic);
//   if (!items.length) throw new Error("No valid items found for processing");

//   const attrDataResult = await db.request().input("idOrder", idOrder).query(`
//     SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder
//   `);
//   if (!attrDataResult?.recordset?.length) throw new Error("No attribute data found for this order");
//   const attrData = attrDataResult.recordset[0];

//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed);
//   const dimWeightFactor = attrData.dimWeightFactor;
//   const packMaterialCost = attrData.packMaterialCost;
//   const corrugateCostPerSf = attrData.corrugateCost;
//   const freightCostPerLb = attrData.freightCostPerLb;

//   const numBoxesArray = runCurrentBoxKitOnly === 0
//     ? Array.from(
//         { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
//         (_, i) => attrData.minimunNumBox + i
//       )
//     : [];

//   await Promise.all(
//     numBoxesArray.map(numBoxes =>
//       executeEvenVolumeDinamico(
//         db,
//         items,
//         attrData,
//         idOrder,
//         numBoxes,
//         dimWeightFactor,
//         packMaterialCost,
//         corrugateCostPerSf,
//         freightCostPerLb,
//         "EvenVolumeDynamic"
//       )
//     )
//   );

//   const boxKitResult = await db.request().input("idOrder", idOrder).query(`
//     SELECT TOP 1 * FROM TB_BoxKitFile 
//     WHERE idOrder = @idOrder 
//     ORDER BY length DESC
//   `);
//   if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");
//   const box = boxKitResult.recordset[0];

//   await executeEvenVolumeDinamico(
//     db,
//     items,
//     attrData,
//     idOrder,
//     currentBoxUsed,
//     dimWeightFactor,
//     packMaterialCost,
//     corrugateCostPerSf,
//     freightCostPerLb,
//     "CurrentEvenVolumeDynamic",
//     box.length,
//     box.width,
//     box.height
//   );

//   return {
//     success: true,
//     message: "RunEvenVolumeDynamic model completed successfully (with dynamic volume)"
//   };
// };
export const runEvenVolumeDinamicoModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const itemsResult = await db.request().input("idOrder", idOrder).query(`
    SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC
  `);
  if (!itemsResult?.recordset?.length) throw new Error("No shipment data found for this order");

  const row = itemsResult.recordset[0];
  const isNormalized =
    row.cubedItemLength > 0 &&
    row.cubedItemWidth > 0 &&
    row.cubedItemHeight > 0 &&
    row.cubedItemWeight > 0;

  const items: ShipmentItem[] = isNormalized
    ? itemsResult.recordset
    : itemsResult.recordset.flatMap(applyAABBHeuristic);

  if (!items.length) throw new Error("No valid items found for processing");

  const attrDataResult = await db.request().input("idOrder", idOrder).query(`
    SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder
  `);
  if (!attrDataResult?.recordset?.length) throw new Error("No attribute data found for this order");
  const attrData = attrDataResult.recordset[0];

  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
  const currentBoxUsed = Number(attrData.currentBoxUsed);
  const dimWeightFactor = attrData.dimWeightFactor;
  const packMaterialCost = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb = attrData.freightCostPerLb;

  const numBoxesArray = runCurrentBoxKitOnly === 0
    ? Array.from(
        { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
        (_, i) => attrData.minimunNumBox + i
      )
    : [];

  await Promise.all(
    numBoxesArray.map(numBoxes =>
      executeEvenVolumeDinamico(
        db,
        items,
        attrData,
        idOrder,
        numBoxes,
        dimWeightFactor,
        packMaterialCost,
        corrugateCostPerSf,
        freightCostPerLb,
        "EvenVolumeDynamic"
      )
    )
  );

  try {
    const boxKitResult = await db.request().input("idOrder", idOrder).query(`
      SELECT TOP 1 * FROM TB_BoxKitFile 
      WHERE idOrder = @idOrder 
      ORDER BY length DESC
    `);
    if (!boxKitResult?.recordset?.length)
      throw new Error("No box kit found for this order");

    const box = boxKitResult.recordset[0];

    await executeEvenVolumeDinamico(
      db,
      items,
      attrData,
      idOrder,
      currentBoxUsed,
      dimWeightFactor,
      packMaterialCost,
      corrugateCostPerSf,
      freightCostPerLb,
      "CurrentEvenVolumeDynamic",
      box.length,
      box.width,
      box.height
    );
  } catch (err) {
    if (err && typeof err === "object" && "message" in err) {
      console.warn(`No se pudo ejecutar CurrentEvenVolumeDynamic: ${(err as any).message}`);
    } else {
      console.warn(`No se pudo ejecutar CurrentEvenVolumeDynamic:`, err);
    }
  }

  return {
    success: true,
    message: "RunEvenVolumeDynamic model completed successfully (with dynamic volume)"
  };
};

export async function executeEvenVolumeDinamico(
  db: any,
  items: ShipmentItem[],
  attrData: any,
  idOrder: number,
  numBoxes: number,
  dimWeightFactor: number,
  packMaterialCost: number,
  corrugateCostPerSf: number,
  freightCostPerLb: number,
  modelName: string,
  fixedBoxLength?: number,
  fixedBoxWidth?: number,
  fixedBoxHeight?: number
) {
  if (!items.length) throw new Error("No items to process");

  const enrichedItems = items.map(item => ({
    ...item,
    itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
  })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

  const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);
  let cumulativeVolume = 0;
  enrichedItems.forEach(item => {
    cumulativeVolume += item.itemVolume;
    (item as any).cumVolume = cumulativeVolume;
    (item as any).cumVolumePct = cumulativeVolume / totalVolume;
  });

  const boxes1 = Math.round(numBoxes * 0.3);
  const boxes2 = Math.round(numBoxes * 0.4);
  const boxes3 = numBoxes - boxes1 - boxes2;

  const cut1Idx = enrichedItems.findIndex(i => (i as any).cumVolumePct >= boxes1 / numBoxes);
  const cut2Idx = enrichedItems.findIndex(i => (i as any).cumVolumePct >= (boxes1 + boxes2) / numBoxes);

  const segment1 = enrichedItems.slice(0, cut1Idx);
  const segment2 = enrichedItems.slice(cut1Idx, cut2Idx);
  const segment3 = enrichedItems.slice(cut2Idx);

  const splitSegment = (segment: typeof enrichedItems, n: number) => {
    if (n <= 0 || segment.length === 0) return Array(n).fill([]);
    const avg = Math.ceil(segment.length / n);
    const result: typeof enrichedItems[] = [];
    for (let i = 0; i < segment.length; i += avg) {
      result.push(segment.slice(i, i + avg));
    }
    while (result.length < n) result.push([]);
    return result;
  };

  const boxesSegments = [
    ...splitSegment(segment1, boxes1),
    ...splitSegment(segment2, boxes2),
    ...splitSegment(segment3, boxes3)
  ];

  const itemBoxMap = new Map<number, { boxLength: number, boxWidth: number, boxHeight: number }>();
  const kitBoxValues: string[] = [];

  for (let i = 0; i < boxesSegments.length; i++) {
    const seg = boxesSegments[i];
    const boxLength: number = safeFloat(fixedBoxLength ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemLength)));
    const boxWidth: number = safeFloat(fixedBoxWidth ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemWidth)));
    const boxHeight: number = safeFloat(fixedBoxHeight ?? Math.max(...seg.map((it: ShipmentItem) => it.cubedItemHeight)));

    kitBoxValues.push(`(
      ${idOrder}, 'Box ${i + 1}', ${numBoxes},
      ${boxLength}, ${boxWidth}, ${boxHeight},
      0, 0, '${modelName}', ${numBoxes}
    )`);

    for (const item of seg) {
      itemBoxMap.set(item.id, { boxLength, boxWidth, boxHeight });
    }
  }

  if (kitBoxValues.length) {
    await db.request().query(`
      INSERT INTO TB_KitBoxes (
        idOrder, boxLabel, boxNumber,
        boxLength, boxWidth, boxHeight,
        fromRow, toRow, model, numBoxes
      ) VALUES ${kitBoxValues.join(',\n')}
    `);
  }

  const MAX_BATCH_SIZE = 500;
  const valuesList: string[] = [];

  for (const item of items) {
    const dims = itemBoxMap.get(item.id);
    if (!dims) continue;

    const { boxLength, boxWidth, boxHeight } = dims;

    const currentBoxVolume = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
    const newBoxVolume = boxLength * boxWidth * boxHeight;
    const itemVolume = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;

      //const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
      //                    item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
      const currentArea =   2*(item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) )+
                          2*(item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));               
      //const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);
      const newArea = 2*(boxLength * (boxWidth + boxHeight) )+ 2*(boxWidth * (boxWidth + boxHeight));
    const currentCorrugateCost = safeFloat((currentArea / 144) * corrugateCostPerSf);
    const newCorrugateCost = safeFloat((newArea / 144) * corrugateCostPerSf);

    const currentDimWeight = safeFloat(currentBoxVolume / dimWeightFactor);
    const newDimWeight = safeFloat(newBoxVolume / dimWeightFactor);

    const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
    const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

    const currentVoidVolume = safeFloat((currentBoxVolume - itemVolume) / 1728);
    const newVoidVolume = safeFloat((newBoxVolume - itemVolume) / 1728);

    const currentVoidFillCost = safeFloat(currentVoidVolume * packMaterialCost);
    const newVoidFillCost = safeFloat(newVoidVolume * packMaterialCost);

    valuesList.push(`(
      ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
      ${boxLength}, ${boxWidth}, ${boxHeight},
      ${currentArea}, ${newArea},
      ${currentCorrugateCost}, ${newCorrugateCost},
      ${currentDimWeight}, ${newDimWeight},
      ${currentBillableWeight}, ${newBillableWeight},
      ${currentBillableWeight * freightCostPerLb}, ${newBillableWeight * freightCostPerLb},
      ${currentVoidVolume}, ${newVoidVolume},
      ${currentVoidFillCost}, ${newVoidFillCost}
    )`);
  }

  for (let i = 0; i < valuesList.length; i += MAX_BATCH_SIZE) {
    const chunk = valuesList.slice(i, i + MAX_BATCH_SIZE);
    await db.request().query(`
      INSERT INTO TB_Results (
        idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
        newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
        currentBoxCorrugateArea, newBoxCorrugateArea,
        currentBoxCorrugateCost, newBoxCorrugateCost,
        currentDimWeight, newDimWeight,
        currentBillableWeight, newBillableWeight,
        currentFreightCost, newFreightCost,
        currentVoidVolume, newVoidVolume,
        currentVoidFillCost, newVoidFillCost
      ) VALUES ${chunk.join(',\n')}
    `);
  }
}

// export const runTopFrequenciesModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const shipmentResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder`);

//   if (!shipmentResult?.recordset?.length) {
//     throw new Error("No shipment data found for this order");
//   }

//   const row = shipmentResult.recordset[0];
//   const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;

//   const items: ShipmentItem[] = isNormalized
//     ? shipmentResult.recordset
//     : shipmentResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

//   const attrDataResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);

//   if (!attrDataResult?.recordset?.length)
//     throw new Error("No attribute data found for this order");

//   const attrData = attrDataResult.recordset[0];
//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed);
//   const dimWeightFactor = attrData.dimWeightFactor;
//   const packMaterialCost = attrData.packMaterialCost;
//   const corrugateCostPerSf = attrData.corrugateCost;
//   const freightCostPerLb = attrData.freightCostPerLb;

//   const minBoxes = Number(attrData.minimunNumBox);
//   const maxBoxes = Number(attrData.maximunNumBox);

//   const boxRange = runCurrentBoxKitOnly === 0
//     ? Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i)
//     : [];

//   await Promise.all(
//     boxRange.map(numBoxes =>
//       executeTopFrequenciesModel(
//         db,
//         items,
//         attrData,
//         idOrder,
//         numBoxes,
//         dimWeightFactor,
//         packMaterialCost,
//         corrugateCostPerSf,
//         freightCostPerLb,
//         "TopFrequencies"
//       )
//     )
//   );

//   const boxKitResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`
//       SELECT TOP 1 * FROM TB_BoxKitFile 
//       WHERE idOrder = @idOrder 
//       ORDER BY length DESC
//     `);

//   if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");

//   const box = boxKitResult.recordset[0];
//   await executeTopFrequenciesModel(
//     db,
//     items,
//     attrData,
//     idOrder,
//     currentBoxUsed,
//     dimWeightFactor,
//     packMaterialCost,
//     corrugateCostPerSf,
//     freightCostPerLb,
//     "CurrentTopFrequencies",
//     box.length,
//     box.width,
//     box.height
//   );

//   return {
//     success: true,
//     message: "TopFrequencies model completed successfully"
//   };
// };

export const runTopFrequenciesModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const shipmentResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder`);

  if (!shipmentResult?.recordset?.length) {
    throw new Error("No shipment data found for this order");
  }

  const row = shipmentResult.recordset[0];
  const isNormalized =
    row.cubedItemLength > 0 &&
    row.cubedItemWidth > 0 &&
    row.cubedItemHeight > 0 &&
    row.cubedItemWeight > 0;

  const items: ShipmentItem[] = isNormalized
    ? shipmentResult.recordset
    : shipmentResult.recordset.flatMap(applyAABBHeuristic);

  if (!items.length) throw new Error("No valid items found for processing");

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);

  if (!attrDataResult?.recordset?.length)
    throw new Error("No attribute data found for this order");

  const attrData = attrDataResult.recordset[0];
  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
  const currentBoxUsed = Number(attrData.currentBoxUsed);
  const dimWeightFactor = attrData.dimWeightFactor;
  const packMaterialCost = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb = attrData.freightCostPerLb;

  const minBoxes = Number(attrData.minimunNumBox);
  const maxBoxes = Number(attrData.maximunNumBox);

  const boxRange = runCurrentBoxKitOnly === 0
    ? Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i)
    : [];

  await Promise.all(
    boxRange.map(numBoxes =>
      executeTopFrequenciesModel(
        db,
        items,
        attrData,
        idOrder,
        numBoxes,
        dimWeightFactor,
        packMaterialCost,
        corrugateCostPerSf,
        freightCostPerLb,
        "TopFrequencies"
      )
    )
  );

  try {
    const boxKitResult = await db.request()
      .input("idOrder", idOrder)
      .query(`
        SELECT TOP 1 * FROM TB_BoxKitFile 
        WHERE idOrder = @idOrder 
        ORDER BY length DESC
      `);

    if (!boxKitResult?.recordset?.length)
      throw new Error("No box kit found for this order");

    const box = boxKitResult.recordset[0];

    await executeTopFrequenciesModel(
      db,
      items,
      attrData,
      idOrder,
      currentBoxUsed,
      dimWeightFactor,
      packMaterialCost,
      corrugateCostPerSf,
      freightCostPerLb,
      "CurrentTopFrequencies",
      box.length,
      box.width,
      box.height
    );
  } catch (err) {
    if (err && typeof err === "object" && "message" in err) {
      console.warn(`No se pudo ejecutar CurrentTopFrequencies: ${(err as any).message}`);
    } else {
      console.warn(`No se pudo ejecutar CurrentTopFrequencies:`, err);
    }
  }

  return {
    success: true,
    message: "TopFrequencies model completed successfully"
  };
};

export async function executeTopFrequenciesModel(
  db: any,
  items: ShipmentItem[],
  attrData: any,
  idOrder: number,
  numBoxes: number,
  dimWeightFactor: number,
  packMaterialCost: number,
  corrugateCostPerSf: number,
  freightCostPerLb: number,
  modelName: string,
  fixedBoxLength?: number,
  fixedBoxWidth?: number,
  fixedBoxHeight?: number
) {
  const enrichedItems = items.map(item => ({
    ...item,
    volume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
  })).sort((a, b) => b.cubedItemLength - a.cubedItemLength);

  const lengthCounts: Record<number, number> = {};
  for (const item of enrichedItems) {
    lengthCounts[item.cubedItemLength] = (lengthCounts[item.cubedItemLength] || 0) + 1;
  }

  const sortedFrequencies = Object.entries(lengthCounts)
    .map(([length, freq]) => ({ length: parseFloat(length), freq }))
    .sort((a, b) => b.freq - a.freq || b.length - a.length);

  const topLengths = sortedFrequencies
    .slice(0, numBoxes - 1)
    .map(entry => entry.length)
    .sort((a, b) => b - a);

  const cutPoints: number[] = [];
  for (const length of topLengths) {
    const index = enrichedItems.findIndex(item => item.cubedItemLength === length);
    if (index !== -1) cutPoints.push(index);
  }
  cutPoints.push(enrichedItems.length);

  const segments: ShipmentItem[][] = [];
  let start = 0;
  for (const end of cutPoints) {
    segments.push(enrichedItems.slice(start, end));
    start = end;
  }

  const kitBoxValues: string[] = [];
  const resultsValues: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment.length) continue;

    const boxLength = fixedBoxLength ?? Math.max(...segment.map(it => it.cubedItemLength));
    const boxWidth = fixedBoxWidth ?? Math.max(...segment.map(it => it.cubedItemWidth));
    const boxHeight = fixedBoxHeight ?? Math.max(...segment.map(it => it.cubedItemHeight));

    const fromRow = items.indexOf(segment[0]) + 1;
    const toRow = items.indexOf(segment[segment.length - 1]) + 1;

    kitBoxValues.push(`(
      ${idOrder}, 'Box ${i + 1}', ${numBoxes},
      ${boxLength}, ${boxWidth}, ${boxHeight},
      ${fromRow}, ${toRow}, '${modelName}', ${numBoxes}
    )`);

    for (const item of segment) {
      const itemVolume = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;
      const currentBoxVolume = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
      const newBoxVolume = boxLength * boxWidth * boxHeight;

      //const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
      //                    item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
      const currentArea =   2*(item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) )+
                          2*(item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));               
      //const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);
      const newArea = 2*(boxLength * (boxWidth + boxHeight) )+ 2*(boxWidth * (boxWidth + boxHeight));

      const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
      const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

      const currentDimWeight = currentBoxVolume / dimWeightFactor;
      const newDimWeight = newBoxVolume / dimWeightFactor;

      const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
      const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

      const currentFreightCost = currentBillableWeight * freightCostPerLb;
      const newFreightCost = newBillableWeight * freightCostPerLb;

      const currentVoidVolume = (currentBoxVolume - itemVolume) / 1728;
      const newVoidVolume = (newBoxVolume - itemVolume) / 1728;

      const currentVoidFillCost = currentVoidVolume * packMaterialCost;
      const newVoidFillCost = newVoidVolume * packMaterialCost;

      resultsValues.push(`(
        ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
        ${boxLength}, ${boxWidth}, ${boxHeight},
        ${currentArea}, ${newArea},
        ${currentCorrugateCost}, ${newCorrugateCost},
        ${currentDimWeight}, ${newDimWeight},
        ${currentBillableWeight}, ${newBillableWeight},
        ${currentFreightCost}, ${newFreightCost},
        ${currentVoidVolume}, ${newVoidVolume},
        ${currentVoidFillCost}, ${newVoidFillCost}
      )`);
    }
  }

  if (kitBoxValues.length) {
    await db.request().query(`
      INSERT INTO TB_KitBoxes (
        idOrder, boxLabel, boxNumber,
        boxLength, boxWidth, boxHeight,
        fromRow, toRow, model, numBoxes
      ) VALUES ${kitBoxValues.join(',\n')}
    `);
  }

  const MAX_BATCH_SIZE = 500;
  for (let i = 0; i < resultsValues.length; i += MAX_BATCH_SIZE) {
    const chunk = resultsValues.slice(i, i + MAX_BATCH_SIZE);
    await db.request().query(`
      INSERT INTO TB_Results (
        idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
        newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
        currentBoxCorrugateArea, newBoxCorrugateArea,
        currentBoxCorrugateCost, newBoxCorrugateCost,
        currentDimWeight, newDimWeight,
        currentBillableWeight, newBillableWeight,
        currentFreightCost, newFreightCost,
        currentVoidVolume, newVoidVolume,
        currentVoidFillCost, newVoidFillCost
      ) VALUES ${chunk.join(',\n')}
    `);
  }
}

// export const runEvenDistributionModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const shipmentResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC`);

//   if (!shipmentResult?.recordset?.length) {
//     throw new Error("No shipment data found for this order");
//   }

//   const row = shipmentResult.recordset[0];
//   const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;

//   const items: ShipmentItem[] = isNormalized
//     ? shipmentResult.recordset
//     : shipmentResult.recordset.flatMap(applyAABBHeuristic);

//   if (!items.length) throw new Error("No valid items found for processing");

//   const attrDataResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
//   if (!attrDataResult?.recordset?.length) throw new Error("No attribute data found for this order");
//   const attrData = attrDataResult.recordset[0];

//   const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
//   const currentBoxUsed = Number(attrData.currentBoxUsed);
//   const dimWeightFactor = attrData.dimWeightFactor;
//   const packMaterialCost = attrData.packMaterialCost;
//   const corrugateCostPerSf = attrData.corrugateCost;
//   const freightCostPerLb = attrData.freightCostPerLb;

//   const minBoxes = Number(attrData.minimunNumBox);
//   const maxBoxes = Number(attrData.maximunNumBox);

//   const boxRange = runCurrentBoxKitOnly === 0
//     ? Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i)
//     : [];

//   await Promise.all(
//     boxRange.map(numBoxes =>
//       executeDistributionModel(
//         db,
//         items,
//         attrData,
//         idOrder,
//         numBoxes,
//         dimWeightFactor,
//         packMaterialCost,
//         corrugateCostPerSf,
//         freightCostPerLb,
//         "EvenDistribution"
//       )
//     )
//   );

//   const boxKitResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT TOP 1 * FROM TB_BoxKitFile WHERE idOrder = @idOrder ORDER BY length DESC`);
//   if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");
//   const box = boxKitResult.recordset[0];

//   await executeDistributionModel(
//     db,
//     items,
//     attrData,
//     idOrder,
//     currentBoxUsed,
//     dimWeightFactor,
//     packMaterialCost,
//     corrugateCostPerSf,
//     freightCostPerLb,
//     "CurrentEvenDistribution",
//     box.length,
//     box.width,
//     box.height
//   );

//   return {
//     success: true,
//     message: "Even Distribution model completed successfully"
//   };
// };
export const runEvenDistributionModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const shipmentResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC`);

  if (!shipmentResult?.recordset?.length) {
    throw new Error("No shipment data found for this order");
  }

  const row = shipmentResult.recordset[0];

  const isNormalized =
    row.cubedItemLength > 0 &&
    row.cubedItemWidth > 0 &&
    row.cubedItemHeight > 0 &&
    row.cubedItemWeight > 0;

  const items: ShipmentItem[] = isNormalized
    ? shipmentResult.recordset
    : shipmentResult.recordset.flatMap(applyAABBHeuristic);

  if (!items.length) throw new Error("No valid items found for processing");

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);

  if (!attrDataResult?.recordset?.length) throw new Error("No attribute data found for this order");
  const attrData = attrDataResult.recordset[0];

  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
  const currentBoxUsed = Number(attrData.currentBoxUsed);
  const dimWeightFactor = attrData.dimWeightFactor;
  const packMaterialCost = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb = attrData.freightCostPerLb;

  const minBoxes = Number(attrData.minimunNumBox);
  const maxBoxes = Number(attrData.maximunNumBox);

  const boxRange = runCurrentBoxKitOnly === 0
    ? Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i)
    : [];

  await Promise.all(
    boxRange.map(numBoxes =>
      executeDistributionModel(
        db,
        items,
        attrData,
        idOrder,
        numBoxes,
        dimWeightFactor,
        packMaterialCost,
        corrugateCostPerSf,
        freightCostPerLb,
        "EvenDistribution"
      )
    )
  );

  const boxKitResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT TOP 1 * FROM TB_BoxKitFile WHERE idOrder = @idOrder ORDER BY length DESC`);
  if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");

  const box = boxKitResult.recordset[0];

  await executeDistributionModel(
    db,
    items,
    attrData,
    idOrder,
    currentBoxUsed,
    dimWeightFactor,
    packMaterialCost,
    corrugateCostPerSf,
    freightCostPerLb,
    "CurrentEvenDistribution",
    box.length,
    box.width,
    box.height
  );

  return {
    success: true,
    message: "Even Distribution model completed successfully"
  };
};

export async function executeDistributionModel(
  db: any,
  items: ShipmentItem[],
  attrData: any,
  idOrder: number,
  numBoxes: number,
  dimWeightFactor: number,
  packMaterialCost: number,
  corrugateCostPerSf: number,
  freightCostPerLb: number,
  modelName: string,
  fixedBoxLength?: number,
  fixedBoxWidth?: number,
  fixedBoxHeight?: number
) {
  if (!items.length) throw new Error("No items to process for distribution");

  const totalRows = items.length;
  const realBoundaries: { start: number; end: number }[] = [];

  if (fixedBoxLength !== undefined) {
    realBoundaries.push({ start: 0, end: items.length - 1 });
  } else {
    const targetRowsPerBox = totalRows / numBoxes;
    let startIdx = 0;

    for (let i = 0; i < numBoxes; i++) {
      let endIdx: number;

      if (i === numBoxes - 1) {
        endIdx = totalRows - 1;
      } else {
        let targetRowIdx = Math.floor(targetRowsPerBox * (i + 1));
        if (targetRowIdx >= totalRows) targetRowIdx = totalRows - 1;

        const targetLength = items[targetRowIdx].cubedItemLength;
        const firstMatchIdx = items.findIndex(it => it.cubedItemLength === targetLength);

        endIdx = Math.max(firstMatchIdx - 1, startIdx);
      }

      realBoundaries.push({ start: startIdx, end: endIdx });
      startIdx = endIdx + 1;
    }
  }

  const kitBoxValues: string[] = [];
  const resultValues: string[] = [];

  for (let i = 0; i < numBoxes; i++) {
    const b = realBoundaries[i] || realBoundaries[realBoundaries.length - 1];
    const segmentItems = items.slice(b.start, b.end + 1);

    const fromRow = segmentItems.length > 0 ? b.start + 1 : 0;
    const toRow = segmentItems.length > 0 ? b.end + 1 : 0;

    const boxLength = fixedBoxLength ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemLength)) : 1);
    const boxWidth = fixedBoxWidth ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemWidth)) : 1);
    const boxHeight = fixedBoxHeight ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(it => it.cubedItemHeight)) : 1);

    kitBoxValues.push(`(
      ${idOrder}, 'Box ${i + 1}', ${numBoxes},
      ${boxLength}, ${boxWidth}, ${boxHeight},
      ${fromRow}, ${toRow}, '${modelName}', ${numBoxes}
    )`);

    for (const item of segmentItems) {
      const itemVolume = item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight;
      const currentBoxVolume = item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight;
      const newBoxVolume = boxLength * boxWidth * boxHeight;

      //const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
      //                    item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
      const currentArea =   2*(item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) )+
                          2*(item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth));               
      //const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);
      const newArea = 2*(boxLength * (boxWidth + boxHeight) )+ 2*(boxWidth * (boxWidth + boxHeight));
      const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
      const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

      const currentDimWeight = currentBoxVolume / dimWeightFactor;
      const newDimWeight = newBoxVolume / dimWeightFactor;

      const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
      const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

      const currentFreightCost = currentBillableWeight * freightCostPerLb;
      const newFreightCost = newBillableWeight * freightCostPerLb;

      const currentVoidVolume = (currentBoxVolume - itemVolume) / 1728;
      const newVoidVolume = (newBoxVolume - itemVolume) / 1728;

      const currentVoidFillCost = currentVoidVolume * packMaterialCost;
      const newVoidFillCost = newVoidVolume * packMaterialCost;

      resultValues.push(`(
        ${idOrder}, ${attrData.id}, ${item.id}, '${modelName}', ${numBoxes},
        ${boxLength}, ${boxWidth}, ${boxHeight},
        ${currentArea}, ${newArea},
        ${currentCorrugateCost}, ${newCorrugateCost},
        ${currentDimWeight}, ${newDimWeight},
        ${currentBillableWeight}, ${newBillableWeight},
        ${currentFreightCost}, ${newFreightCost},
        ${currentVoidVolume}, ${newVoidVolume},
        ${currentVoidFillCost}, ${newVoidFillCost}
      )`);
    }
  }

  if (kitBoxValues.length) {
    await db.request().query(`
      INSERT INTO TB_KitBoxes (
        idOrder, boxLabel, boxNumber,
        boxLength, boxWidth, boxHeight,
        fromRow, toRow, model, numBoxes
      ) VALUES ${kitBoxValues.join(',\n')}
    `);
  }

  const MAX_BATCH_SIZE = 500;
  for (let i = 0; i < resultValues.length; i += MAX_BATCH_SIZE) {
    const chunk = resultValues.slice(i, i + MAX_BATCH_SIZE);
    await db.request().query(`
      INSERT INTO TB_Results (
        idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
        newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
        currentBoxCorrugateArea, newBoxCorrugateArea,
        currentBoxCorrugateCost, newBoxCorrugateCost,
        currentDimWeight, newDimWeight,
        currentBillableWeight, newBillableWeight,
        currentFreightCost, newFreightCost,
        currentVoidVolume, newVoidVolume,
        currentVoidFillCost, newVoidFillCost
      ) VALUES ${chunk.join(',\n')}
    `);
  }
}

export const runEvenVolumeModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const shipmentResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC`);

  if (!shipmentResult?.recordset?.length) {
    throw new Error("No shipment data found for this order");
  }

  const row = shipmentResult.recordset[0];
  const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;

  const items: ShipmentItem[] = isNormalized
    ? shipmentResult.recordset
    : shipmentResult.recordset.flatMap(applyAABBHeuristic);

  if (!items.length) throw new Error("No valid items found for processing");

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);
  if (!attrDataResult?.recordset?.length) throw new Error("No attribute data found for this order");
  const attrData = attrDataResult.recordset[0];

  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);
  const currentBoxUsed = Number(attrData.currentBoxUsed);
  const dimWeightFactor = attrData.dimWeightFactor;
  const packMaterialCost = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb = attrData.freightCostPerLb;

  const minBoxes = Number(attrData.minimunNumBox);
  const maxBoxes = Number(attrData.maximunNumBox);

  const boxRange = runCurrentBoxKitOnly === 0
    ? Array.from({ length: maxBoxes - minBoxes + 1 }, (_, i) => minBoxes + i)
    : [];

  await Promise.all(
    boxRange.map(numBoxes =>
      executeEvenVolume(
        db,
        items,
        attrData,
        idOrder,
        numBoxes,
        dimWeightFactor,
        packMaterialCost,
        corrugateCostPerSf,
        freightCostPerLb,
        "EvenVolume"
      )
    )
  );

  const boxKitResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT TOP 1 * FROM TB_BoxKitFile WHERE idOrder = @idOrder ORDER BY length DESC`);
  if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");
  const box = boxKitResult.recordset[0];

  await executeEvenVolume(
    db,
    items,
    attrData,
    idOrder,
    currentBoxUsed,
    dimWeightFactor,
    packMaterialCost,
    corrugateCostPerSf,
    freightCostPerLb,
    "CurrentEvenVolume",
    box.length,
    box.width,
    box.height
  );

  return {
    success: true,
    message: "RunEvenVolume model completed successfully"
  };
};

