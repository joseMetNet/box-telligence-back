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

  // 1. Obtener todos los modelos disponibles en TB_Results para el idOrder
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

  const modelGroups = [];

  for (const model of filteredModels) {
    const modelExists = allModels.includes(model);
    const currentModelName = currentModels[model];
    const currentModelExists = allModels.includes(currentModelName);

    let boxNumbers: number[] = [];
    let results: any[] = [];
    let total = 0;

    if (modelExists) {
      // Obtener boxNumbers únicos paginados
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
          SELECT COUNT(DISTINCT boxNumber) as total
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
        `);

      total = totalBoxNumbersResult.recordset[0]?.total || 0;

      // Traer resultados de esos boxNumbers
      if (boxNumbers.length > 0) {
        const inClause = boxNumbers.map((_, i) => `@boxNumber${i}`).join(',');
        const request = db.request()
          .input("idOrder", idOrder)
          .input("model", model);
        boxNumbers.forEach((num, i) => request.input(`boxNumber${i}`, num));

        const resultsQuery = await request.query(`
          SELECT r.*, s.orderId, s.item1Length, s.item1Width, s.item1Height, s.item1Weight,
                 s.item2Length, s.item2Width, s.item2Height, s.item2Weight,
                 s.item3Length, s.item3Width, s.item3Height, s.item3Weight,
                 s.item4Length, s.item4Width, s.item4Height, s.item4Weight,
                 s.item5Length, s.item5Width, s.item5Height, s.item5Weight
          FROM TB_Results r
          LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
          WHERE r.idOrder = @idOrder AND r.model = @model
            AND r.boxNumber IN (${inClause})
          ORDER BY r.boxNumber, r.id
        `);
        results = resultsQuery.recordset;
      }
    }

    // Stats de attributeData (siempre se consultan si existe la orden)
    const statsResult = await db
      .request()
      .input("idOrder", idOrder)
      .query(`
        SELECT 
              currentBoxUsed as totalBoxesUsed, 
              minimunNumBox as minBoxNumber, 
              maximunNumBox as maxBoxNumber
        FROM TB_AttributeData
        WHERE idOrder = @idOrder 
      `);

    const { totalBoxesUsed, minBoxNumber, maxBoxNumber } = statsResult.recordset[0] || { totalBoxesUsed: 0, minBoxNumber: null, maxBoxNumber: null };

    const summaryCards = [
      { label: 'Current Number of Boxes Used', value: totalBoxesUsed },
      { label: 'Minimum Number of Boxes to Analyze', value: minBoxNumber },
      { label: 'Maximum Number of Boxes to Analyze', value: maxBoxNumber }
    ];

    // Obtener resultados del modelo Current...
    let currentResults: any[] = [];
    if (currentModelExists) {
      const currentResultsQuery = await db.request()
        .input("idOrder", idOrder)
        .input("model", currentModelName)
        .query(`
          SELECT *
          FROM TB_Results
          WHERE idOrder = @idOrder AND model = @model
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
      [currentModelName]: currentResults,
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

export const runEvenDistributionModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const itemsResult = await db.request().input("idOrder", idOrder).query(`
    SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC
  `);
  if (!itemsResult?.recordset?.length) throw new Error("No shipment data found for this order");
  const items: ShipmentItem[] = itemsResult.recordset;

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

  let numBoxesArray: number[] = [];

  if (runCurrentBoxKitOnly === 0) {
    numBoxesArray = Array.from(
      { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
      (_, i) => attrData.minimunNumBox + i
    );
  }

  for (const numBoxes of numBoxesArray) {
    await executeDistributionModel(
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
    );
  }

  const boxKitResult = await db.request().input("idOrder", idOrder).query(`
    SELECT TOP 1 * FROM TB_BoxKitFile 
    WHERE idOrder = @idOrder 
    ORDER BY length DESC
  `);
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


async function executeDistributionModel(
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
  const segments: { startIdx: number; endIdx: number }[] = [];
  let usedIndices = 0;
  for (let i = 0; i < numBoxes; i++) {
    const remaining = items.length - usedIndices;
    const boxesLeft = numBoxes - i;
    const size = Math.floor(remaining / boxesLeft);
    const startIdx = usedIndices;
    const endIdx = i === numBoxes - 1 ? items.length - 1 : usedIndices + size - 1;
    if (startIdx <= endIdx) {
      segments.push({ startIdx, endIdx });
      usedIndices = endIdx + 1;
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const { startIdx, endIdx } = segments[i];
    const segmentItems = items.slice(startIdx, endIdx + 1);

    const boxLength = fixedBoxLength ?? segmentItems[0].cubedItemLength;
    const boxWidth = fixedBoxWidth ?? Math.max(...segmentItems.map(item => item.cubedItemWidth));
    const boxHeight = fixedBoxHeight ?? Math.max(...segmentItems.map(item => item.cubedItemHeight));
    const boxLabel = modelName === "CurrentEvenDistribution" ? "CurrentEvenDistribution" : i === 0 ? "Anchor Box" : `Box ${i}`;

    await db.request()
      .input("idOrder", idOrder)
      .input("boxLabel", boxLabel)
      .input("boxNumber", i)
      .input("boxLength", boxLength)
      .input("boxWidth", boxWidth)
      .input("boxHeight", boxHeight)
      .input("fromRow", startIdx + 1)
      .input("toRow", endIdx + 1)
      .input("model", modelName)
      .input("numBoxes", numBoxes)
      .query(`
        INSERT INTO TB_KitBoxes (
          idOrder, boxLabel, boxNumber, boxLength, boxWidth, boxHeight,
          fromRow, toRow, model, numBoxes
        ) VALUES (
          @idOrder, @boxLabel, @boxNumber, @boxLength, @boxWidth, @boxHeight,
          @fromRow, @toRow, @model, @numBoxes
        )
      `);

    for (const item of segmentItems) {
      const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
      const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);

      const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
      const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

      const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
      const newDimWeight = (boxLength * boxWidth * boxHeight) / dimWeightFactor;

      const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
      const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

      const currentFreightCost = currentBillableWeight * freightCostPerLb;
      const newFreightCost = newBillableWeight * freightCostPerLb;

      const currentVoidVolume = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;
      const newVoidVolume = (boxLength * boxWidth * boxHeight - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;

      const currentVoidFillCost = currentVoidVolume * packMaterialCost;
      const newVoidFillCost = newVoidVolume * packMaterialCost;

      await db.request()
        .input("idOrder", idOrder)
        .input("idAttributeData", attrData.id)
        .input("idShipmenDataFile", item.id)
        .input("model", modelName)
        .input("boxNumber", numBoxes)
        .input("newAssignedBoxLength", boxLength)
        .input("newAssignedBoxWidth", boxWidth)
        .input("newAssignedBoxHeight", boxHeight)
        .input("currentBoxCorrugateArea", currentArea)
        .input("newBoxCorrugateArea", newArea)
        .input("currentBoxCorrugateCost", currentCorrugateCost)
        .input("newBoxCorrugateCost", newCorrugateCost)
        .input("currentDimWeight", currentDimWeight)
        .input("newDimWeight", newDimWeight)
        .input("currentBillableWeight", currentBillableWeight)
        .input("newBillableWeight", newBillableWeight)
        .input("currentFreightCost", currentFreightCost)
        .input("newFreightCost", newFreightCost)
        .input("currentVoidVolume", currentVoidVolume)
        .input("newVoidVolume", newVoidVolume)
        .input("currentVoidFillCost", currentVoidFillCost)
        .input("newVoidFillCost", newVoidFillCost)
        .query(`
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
          ) VALUES (
            @idOrder, @idAttributeData, @idShipmenDataFile, @model, @boxNumber,
            @newAssignedBoxLength, @newAssignedBoxWidth, @newAssignedBoxHeight,
            @currentBoxCorrugateArea, @newBoxCorrugateArea,
            @currentBoxCorrugateCost, @newBoxCorrugateCost,
            @currentDimWeight, @newDimWeight,
            @currentBillableWeight, @newBillableWeight,
            @currentFreightCost, @newFreightCost,
            @currentVoidVolume, @newVoidVolume,
            @currentVoidFillCost, @newVoidFillCost
          )
        `);
    }
  }
}

// export const runTopFrequenciesModel = async (idOrder: number) => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");

//   const itemsResult = await db.request()
//     .input("idOrder", idOrder)
//     .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC`);

//   if (!itemsResult?.recordset?.length)
//     throw new Error("No shipment data found for this order");

//   const items: ShipmentItem[] = itemsResult.recordset;

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

//   let numBoxesArray: number[] = [];

//   if (runCurrentBoxKitOnly === 0) {
//     numBoxesArray = Array.from(
//       { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
//       (_, i) => attrData.minimunNumBox + i
//     );
//   }

//   for (const numBoxes of numBoxesArray) {
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
//       "TopFrequencies"
//     );
//   }

//   const boxKitResult = await db.request().input("idOrder", idOrder).query(`
//     SELECT TOP 1 * FROM TB_BoxKitFile 
//     WHERE idOrder = @idOrder 
//     ORDER BY length DESC
//   `);
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
//     message: "TopFrequencies model completed successfully",
//   };
// };

// async function executeTopFrequenciesModel(
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
//   const segmentSize = Math.floor(items.length / numBoxes);
//   let startIdx = 0;

//   for (let i = 0; i < numBoxes; i++) {
//     const endIdx = i === numBoxes - 1 ? items.length - 1 : (i + 1) * segmentSize - 1;
//     if (startIdx > endIdx) continue;

//     const segmentItems = items.slice(startIdx, endIdx + 1);

//     const boxLength = fixedBoxLength ?? Math.max(...segmentItems.map(item => item.cubedItemLength));
//     const boxWidth = fixedBoxWidth ?? Math.max(...segmentItems.map(item => item.cubedItemWidth));
//     const boxHeight = fixedBoxHeight ?? Math.max(...segmentItems.map(item => item.cubedItemHeight));

//     const boxLabel = modelName === "CurrentTopFrequencies" ? "CurrentTopFrequencies" : i === 0 ? "Anchor Box" : `Box ${i}`;

//     await db.request()
//       .input("idOrder", idOrder)
//       .input("boxLabel", boxLabel)
//       .input("boxNumber", i)
//       .input("boxLength", boxLength)
//       .input("boxWidth", boxWidth)
//       .input("boxHeight", boxHeight)
//       .input("fromRow", startIdx + 1)
//       .input("toRow", endIdx + 1)
//       .input("model", modelName)
//       .input("numBoxes", numBoxes)
//       .query(`
//         INSERT INTO TB_KitBoxes (
//           idOrder, boxLabel, boxNumber, boxLength, boxWidth, boxHeight,
//           fromRow, toRow, model, numBoxes
//         ) VALUES (
//           @idOrder, @boxLabel, @boxNumber, @boxLength, @boxWidth, @boxHeight,
//           @fromRow, @toRow, @model, @numBoxes
//         )
//       `);

//     for (const item of segmentItems) {
//       const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
//       const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);

//       const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
//       const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

//       const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
//       const newDimWeight = (boxLength * boxWidth * boxHeight) / dimWeightFactor;

//       const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
//       const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

//       const currentFreightCost = currentBillableWeight * freightCostPerLb;
//       const newFreightCost = newBillableWeight * freightCostPerLb;

//       const currentVoidVolume = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;
//       const newVoidVolume = (boxLength * boxWidth * boxHeight - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;

//       const currentVoidFillCost = currentVoidVolume * packMaterialCost;
//       const newVoidFillCost = newVoidVolume * packMaterialCost;

//       await db.request()
//         .input("idOrder", idOrder)
//         .input("idAttributeData", attrData.id)
//         .input("idShipmenDataFile", item.id)
//         .input("model", modelName)
//         .input("boxNumber", numBoxes)
//         .input("newAssignedBoxLength", boxLength)
//         .input("newAssignedBoxWidth", boxWidth)
//         .input("newAssignedBoxHeight", boxHeight)
//         .input("currentBoxCorrugateArea", currentArea)
//         .input("newBoxCorrugateArea", newArea)
//         .input("currentBoxCorrugateCost", currentCorrugateCost)
//         .input("newBoxCorrugateCost", newCorrugateCost)
//         .input("currentDimWeight", currentDimWeight)
//         .input("newDimWeight", newDimWeight)
//         .input("currentBillableWeight", currentBillableWeight)
//         .input("newBillableWeight", newBillableWeight)
//         .input("currentFreightCost", currentFreightCost)
//         .input("newFreightCost", newFreightCost)
//         .input("currentVoidVolume", currentVoidVolume)
//         .input("newVoidVolume", newVoidVolume)
//         .input("currentVoidFillCost", currentVoidFillCost)
//         .input("newVoidFillCost", newVoidFillCost)
//         .query(`
//           INSERT INTO TB_Results (
//             idOrder, idAttributeData, idShipmenDataFile, model, boxNumber,
//             newAssignedBoxLength, newAssignedBoxWidth, newAssignedBoxHeight,
//             currentBoxCorrugateArea, newBoxCorrugateArea,
//             currentBoxCorrugateCost, newBoxCorrugateCost,
//             currentDimWeight, newDimWeight,
//             currentBillableWeight, newBillableWeight,
//             currentFreightCost, newFreightCost,
//             currentVoidVolume, newVoidVolume,
//             currentVoidFillCost, newVoidFillCost
//           ) VALUES (
//             @idOrder, @idAttributeData, @idShipmenDataFile, @model, @boxNumber,
//             @newAssignedBoxLength, @newAssignedBoxWidth, @newAssignedBoxHeight,
//             @currentBoxCorrugateArea, @newBoxCorrugateArea,
//             @currentBoxCorrugateCost, @newBoxCorrugateCost,
//             @currentDimWeight, @newDimWeight,
//             @currentBillableWeight, @newBillableWeight,
//             @currentFreightCost, @newFreightCost,
//             @currentVoidVolume, @newVoidVolume,
//             @currentVoidFillCost, @newVoidFillCost
//           )
//         `);
//     }
//   }
// }

export const runEvenVolumeModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const itemsResult = await db.request().input("idOrder", idOrder).query(`
    SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC
  `);
  if (!itemsResult?.recordset?.length) throw new Error("No shipment data found for this order");
  const items: ShipmentItem[] = itemsResult.recordset;

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

  let numBoxesArray: number[] = [];
  if (runCurrentBoxKitOnly === 0) {
    numBoxesArray = Array.from(
      { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
      (_, i) => attrData.minimunNumBox + i
    );
  }

  for (const numBoxes of numBoxesArray) {
    await executeEvenVolume(db, items, attrData, idOrder, numBoxes, dimWeightFactor, packMaterialCost, corrugateCostPerSf, freightCostPerLb, "EvenVolume");
  }

  const boxKitResult = await db.request().input("idOrder", idOrder).query(`
    SELECT TOP 1 * FROM TB_BoxKitFile 
    WHERE idOrder = @idOrder 
    ORDER BY length DESC
  `);
  if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");
  const box = boxKitResult.recordset[0];

  await executeEvenVolume(db, items, attrData, idOrder, currentBoxUsed, dimWeightFactor, packMaterialCost, corrugateCostPerSf, freightCostPerLb, "CurrentEvenVolume", box.length, box.width, box.height);

  return {
    success: true,
    message: "RunEvenVolume model completed successfully"
  };
};

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
  const enrichedItems = items.map(item => ({
    ...item,
    itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
  })).sort((a, b) => b.itemVolume - a.itemVolume);

  const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);
  const targetVolumePerBox = totalVolume / numBoxes;

  const segmentStartIndexes = [0];
  let accVolume = 0;
  let currentBox = 1;

  for (let i = 0; i < enrichedItems.length; i++) {
    accVolume += enrichedItems[i].itemVolume;
    if (accVolume >= currentBox * targetVolumePerBox && currentBox < numBoxes) {
      segmentStartIndexes.push(i + 1);
      currentBox++;
    }
  }
  segmentStartIndexes.push(enrichedItems.length);

  const segments: ShipmentItem[][] = [];
  for (let i = 0; i < numBoxes; i++) {
    const from = segmentStartIndexes[i];
    const to = segmentStartIndexes[i + 1];
    if (to <= from) continue;
    segments.push(enrichedItems.slice(from, to));
  }

  const anchorBox = segments[0];
  const boxLength = fixedBoxLength ?? Math.max(...anchorBox.map(i => i.cubedItemLength));
  const boxWidth = fixedBoxWidth ?? Math.max(...anchorBox.map(i => i.cubedItemWidth));
  const boxHeight = fixedBoxHeight ?? Math.max(...anchorBox.map(i => i.cubedItemHeight));

  for (let i = 0; i < segments.length; i++) {
    for (const item of segments[i]) {
      const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
      const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);

      const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
      const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

      const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
      const newDimWeight = (boxLength * boxWidth * boxHeight) / dimWeightFactor;

      const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
      const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

      const currentFreightCost = currentBillableWeight * freightCostPerLb;
      const newFreightCost = newBillableWeight * freightCostPerLb;

      const currentVoidVolume = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;
      const newVoidVolume = (boxLength * boxWidth * boxHeight - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;

      const currentVoidFillCost = currentVoidVolume * packMaterialCost;
      const newVoidFillCost = newVoidVolume * packMaterialCost;

      await db.request()
        .input("idOrder", idOrder)
        .input("idAttributeData", attrData.id)
        .input("idShipmenDataFile", item.id)
        .input("model", modelName)
        .input("boxNumber", numBoxes)
        .input("newAssignedBoxLength", boxLength)
        .input("newAssignedBoxWidth", boxWidth)
        .input("newAssignedBoxHeight", boxHeight)
        .input("currentBoxCorrugateArea", currentArea)
        .input("newBoxCorrugateArea", newArea)
        .input("currentBoxCorrugateCost", currentCorrugateCost)
        .input("newBoxCorrugateCost", newCorrugateCost)
        .input("currentDimWeight", currentDimWeight)
        .input("newDimWeight", newDimWeight)
        .input("currentBillableWeight", currentBillableWeight)
        .input("newBillableWeight", newBillableWeight)
        .input("currentFreightCost", currentFreightCost)
        .input("newFreightCost", newFreightCost)
        .input("currentVoidVolume", currentVoidVolume)
        .input("newVoidVolume", newVoidVolume)
        .input("currentVoidFillCost", currentVoidFillCost)
        .input("newVoidFillCost", newVoidFillCost)
        .query(`
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
          ) VALUES (
            @idOrder, @idAttributeData, @idShipmenDataFile, @model, @boxNumber,
            @newAssignedBoxLength, @newAssignedBoxWidth, @newAssignedBoxHeight,
            @currentBoxCorrugateArea, @newBoxCorrugateArea,
            @currentBoxCorrugateCost, @newBoxCorrugateCost,
            @currentDimWeight, @newDimWeight,
            @currentBillableWeight, @newBillableWeight,
            @currentFreightCost, @newFreightCost,
            @currentVoidVolume, @newVoidVolume,
            @currentVoidFillCost, @newVoidFillCost
          )
        `);
    }
  }
}

export const runEvenVolumeDinamicoModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const itemsResult = await db.request().input("idOrder", idOrder).query(`
    SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC
  `);
  if (!itemsResult?.recordset?.length) throw new Error("No shipment data found for this order");
  const items: ShipmentItem[] = itemsResult.recordset;

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

  let numBoxesArray: number[] = [];
  if (runCurrentBoxKitOnly === 0) {
    numBoxesArray = Array.from(
      { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
      (_, i) => attrData.minimunNumBox + i
    );
  }

  for (const numBoxes of numBoxesArray) {
    await executeEvenVolumeDinamico(
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
    );
  }

  const boxKitResult = await db.request().input("idOrder", idOrder).query(`
    SELECT TOP 1 * FROM TB_BoxKitFile 
    WHERE idOrder = @idOrder 
    ORDER BY length DESC
  `);
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
    "CurrentEvenVolumeDynamic",
    box.length,
    box.width,
    box.height
  );

  return {
    success: true,
    message: "RunEvenVolumeDynamic model completed successfully (with dynamic volume)"
  };
};

async function executeEvenVolumeDinamico(
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
    itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
  })).sort((a, b) => b.itemVolume - a.itemVolume);

  const referenceSegments = { large: 7.5, medium: 10, small: 15 };
  const scale = 10 / numBoxes;
  const scaled = {
    large: referenceSegments.large * scale,
    medium: referenceSegments.medium * scale,
    small: referenceSegments.small * scale
  };
  const numLarge = Math.round(numBoxes * 0.3);
  const numMedium = Math.round(numBoxes * 0.3);
  const numSmall = numBoxes - numLarge - numMedium;
  const scaledPercentages = [
    ...Array(numLarge).fill(scaled.large),
    ...Array(numMedium).fill(scaled.medium),
    ...Array(numSmall).fill(scaled.small)
  ];

  const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);
  const breakpoints = scaledPercentages.map((p, i) =>
    scaledPercentages.slice(0, i + 1).reduce((a, b) => a + b, 0) / 100 * totalVolume
  );

  const segmentStartIndexes: number[] = [0];
  let accVolume = 0;
  let currentBox = 0;
  for (let i = 0; i < enrichedItems.length && currentBox < numBoxes - 1; i++) {
    accVolume += enrichedItems[i].itemVolume;
    if (accVolume >= breakpoints[currentBox]) {
      segmentStartIndexes.push(i + 1);
      currentBox++;
    }
  }
  segmentStartIndexes.push(enrichedItems.length);

  const segments: ShipmentItem[][] = [];
  for (let i = 0; i < numBoxes; i++) {
    const from = segmentStartIndexes[i];
    const to = segmentStartIndexes[i + 1];
    if (to <= from) continue;
    segments.push(enrichedItems.slice(from, to));
  }

  const anchorBox = segments[0];
  const boxLength = fixedBoxLength ?? Math.max(...anchorBox.map(i => i.cubedItemLength));
  const boxWidth = fixedBoxWidth ?? Math.max(...anchorBox.map(i => i.cubedItemWidth));
  const boxHeight = fixedBoxHeight ?? Math.max(...anchorBox.map(i => i.cubedItemHeight));

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment.length) continue;

    const fromRow = segment[0].id;
    const toRow = segment[segment.length - 1].id;

    await db.request()
      .input("idOrder", idOrder)
      .input("model", modelName)
      .input("boxLabel", `Box ${i + 1}`)
      .input("boxNumber", i + 1)
      .input("boxLength", boxLength)
      .input("boxWidth", boxWidth)
      .input("boxHeight", boxHeight)
      .input("fromRow", fromRow)
      .input("toRow", toRow)
      .input("numBoxes", numBoxes)
      .query(`
        INSERT INTO TB_KitBoxes (
          idOrder, model, boxLabel, boxNumber,
          boxLength, boxWidth, boxHeight,
          fromRow, toRow, numBoxes
        ) VALUES (
          @idOrder, @model, @boxLabel, @boxNumber,
          @boxLength, @boxWidth, @boxHeight,
          @fromRow, @toRow, @numBoxes
        )
      `);

    for (const item of segment) {
      const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
                          item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
      const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);

      const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
      const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

      const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
      const newDimWeight = (boxLength * boxWidth * boxHeight) / dimWeightFactor;

      const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
      const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

      const currentFreightCost = currentBillableWeight * freightCostPerLb;
      const newFreightCost = newBillableWeight * freightCostPerLb;

      const currentVoidVolume = (
        item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight -
        item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
      ) / 1728;
      const newVoidVolume = (
        boxLength * boxWidth * boxHeight -
        item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight
      ) / 1728;

      const currentVoidFillCost = currentVoidVolume * packMaterialCost;
      const newVoidFillCost = newVoidVolume * packMaterialCost;

      await db.request()
        .input("idOrder", idOrder)
        .input("idAttributeData", attrData.id)
        .input("idShipmenDataFile", item.id)
        .input("model", modelName)
        .input("boxNumber", numBoxes)
        .input("newAssignedBoxLength", boxLength)
        .input("newAssignedBoxWidth", boxWidth)
        .input("newAssignedBoxHeight", boxHeight)
        .input("currentBoxCorrugateArea", currentArea)
        .input("newBoxCorrugateArea", newArea)
        .input("currentBoxCorrugateCost", currentCorrugateCost)
        .input("newBoxCorrugateCost", newCorrugateCost)
        .input("currentDimWeight", currentDimWeight)
        .input("newDimWeight", newDimWeight)
        .input("currentBillableWeight", currentBillableWeight)
        .input("newBillableWeight", newBillableWeight)
        .input("currentFreightCost", currentFreightCost)
        .input("newFreightCost", newFreightCost)
        .input("currentVoidVolume", currentVoidVolume)
        .input("newVoidVolume", newVoidVolume)
        .input("currentVoidFillCost", currentVoidFillCost)
        .input("newVoidFillCost", newVoidFillCost)
        .query(`
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
          ) VALUES (
            @idOrder, @idAttributeData, @idShipmenDataFile, @model, @boxNumber,
            @newAssignedBoxLength, @newAssignedBoxWidth, @newAssignedBoxHeight,
            @currentBoxCorrugateArea, @newBoxCorrugateArea,
            @currentBoxCorrugateCost, @newBoxCorrugateCost,
            @currentDimWeight, @newDimWeight,
            @currentBillableWeight, @newBillableWeight,
            @currentFreightCost, @newFreightCost,
            @currentVoidVolume, @newVoidVolume,
            @currentVoidFillCost, @newVoidFillCost
          )
        `);
    }
  }
}

export const getModelImprovementByIdOrder = async (
  idOrder: number,
  model: "EvenDistribution" | "TopFrequencies" | "EvenVolumeDynamic" | "EvenVolume"
) => {
  const db = await connectToSqlServer();

  // Construir el nombre del modelo actual
  const currentModel = `Current${model}`;

  // Obtener los datos del modelo optimizado
  const optimizedResult: any = await db?.request()
    .input("idOrder", idOrder)
    .input("model", model)
    .query(`
      SELECT * FROM TB_Results
      WHERE idOrder = @idOrder AND model = @model
    `);

  if (!optimizedResult.recordset.length) {
    throw new Error(`No optimized results found for model: ${model}`);
  }

  // Obtener los datos del modelo actual
  const currentResult: any = await db?.request()
    .input("idOrder", idOrder)
    .input("model", currentModel)
    .query(`
      SELECT * FROM TB_Results
      WHERE idOrder = @idOrder AND model = @model
      ORDER BY id ASC
    `);

  if (!currentResult.recordset.length) {
    throw new Error(`No current results found for model: ${currentModel}`);
  }

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

  return improvements;
};

export const getBoxDimensionsByOrderAndModel = async (
  idOrder: number,
  model:
    | "EvenDistribution"
    | "TopFrequencies"
    | "EvenVolumeDynamic"
    | "EvenVolume"
) => {
  const db = await connectToSqlServer();

  let result = await db?.request()
    .input("idOrder", idOrder)
    .input("model", model)
    .query(`
      SELECT DISTINCT boxLabel,
        CAST(boxLength AS FLOAT) AS boxLength,
        CAST(boxWidth AS FLOAT) AS boxWidth,
        CAST(boxHeight AS FLOAT) AS boxHeight
      FROM TB_KitBoxes
      WHERE idOrder = @idOrder AND model = @model
      ORDER BY boxLength DESC, boxWidth DESC, boxHeight DESC
    `);

  if (!result?.recordset?.length) {
    const currentModel = `Current${model}`;
    result = await db?.request()
      .input("idOrder", idOrder)
      .input("model", currentModel)
      .query(`
        SELECT DISTINCT boxLabel,
          CAST(boxLength AS FLOAT) AS boxLength,
          CAST(boxWidth AS FLOAT) AS boxWidth,
          CAST(boxHeight AS FLOAT) AS boxHeight
        FROM TB_KitBoxes
        WHERE idOrder = @idOrder AND model = @model
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

  console.log("👉 Heuristic AABB result:", { rowId: row.id, rawItems, box });

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
  }];
}

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

  // Ajuste clave: validar por null, no solo existencia de campo
  const isNormalized = row.cubedItemLength !== null && row.cubedItemLength !== undefined;

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

  for (const numBoxes of boxRange) {
    const modelName = `TopFrequencies`;
    await executeTopFrequenciesModel(
      db,
      items,
      attrData,
      idOrder,
      numBoxes,
      dimWeightFactor,
      packMaterialCost,
      corrugateCostPerSf,
      freightCostPerLb,
      modelName
    );
  }

  const boxKitResult = await db.request()
    .input("idOrder", idOrder)
    .query(`
      SELECT TOP 1 * FROM TB_BoxKitFile 
      WHERE idOrder = @idOrder 
      ORDER BY length DESC
    `);

  if (!boxKitResult?.recordset?.length) throw new Error("No box kit found for this order");

  const box = boxKitResult.recordset[0];
  const modelName = `CurrentTopFrequencies`;

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
    modelName,
    box.length,
    box.width,
    box.height
  );

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
  // Crear N segmentos vacíos
  const segments: ShipmentItem[][] = Array.from({ length: numBoxes }, () => []);

  // Distribuir ítems en round-robin
  for (let i = 0; i < items.length; i++) {
    const boxIndex = i % numBoxes;
    segments[boxIndex].push(items[i]);
  }

  for (let i = 0; i < numBoxes; i++) {
    const segmentItems = segments[i];
    const fromRow = segmentItems.length > 0 ? items.indexOf(segmentItems[0]) + 1 : 0;
    const toRow = segmentItems.length > 0 ? items.indexOf(segmentItems[segmentItems.length - 1]) + 1 : 0;

    const boxLength = fixedBoxLength ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(item => item.cubedItemLength)) : 1);
    const boxWidth = fixedBoxWidth ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(item => item.cubedItemWidth)) : 1);
    const boxHeight = fixedBoxHeight ?? (segmentItems.length > 0 ? Math.max(...segmentItems.map(item => item.cubedItemHeight)) : 1);

    const boxLabel = `Box ${i + 1}`;
    const boxNumber = numBoxes

    // Guardar caja
    await db.request()
      .input("idOrder", idOrder)
      .input("boxLabel", boxLabel)
      .input("boxNumber", boxNumber)
      .input("boxLength", boxLength)
      .input("boxWidth", boxWidth)
      .input("boxHeight", boxHeight)
      .input("fromRow", fromRow)
      .input("toRow", toRow)
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

    // Insertar resultados por ítem (si el segmento tiene ítems)
    for (const item of segmentItems) {
      const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)
        + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);
      const newArea = boxLength * (boxWidth + boxHeight) + boxWidth * (boxWidth + boxHeight);

      const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
      const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

      const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
      const newDimWeight = (boxLength * boxWidth * boxHeight) / dimWeightFactor;

      const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
      const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

      const currentFreightCost = currentBillableWeight * freightCostPerLb;
      const newFreightCost = newBillableWeight * freightCostPerLb;

      const currentVoidVolume = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight
        - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;

      const newVoidVolume = (boxLength * boxWidth * boxHeight
        - item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) / 1728;

      const currentVoidFillCost = currentVoidVolume * packMaterialCost;
      const newVoidFillCost = newVoidVolume * packMaterialCost;

      await db.request()
        .input("idOrder", idOrder)
        .input("idAttributeData", attrData.id)
        .input("idShipmenDataFile", item.id)
        .input("model", modelName)
        .input("boxNumber", boxNumber)
        .input("newAssignedBoxLength", boxLength)
        .input("newAssignedBoxWidth", boxWidth)
        .input("newAssignedBoxHeight", boxHeight)
        .input("currentBoxCorrugateArea", currentArea)
        .input("newBoxCorrugateArea", newArea)
        .input("currentBoxCorrugateCost", currentCorrugateCost)
        .input("newBoxCorrugateCost", newCorrugateCost)
        .input("currentDimWeight", currentDimWeight)
        .input("newDimWeight", newDimWeight)
        .input("currentBillableWeight", currentBillableWeight)
        .input("newBillableWeight", newBillableWeight)
        .input("currentFreightCost", currentFreightCost)
        .input("newFreightCost", newFreightCost)
        .input("currentVoidVolume", currentVoidVolume)
        .input("newVoidVolume", newVoidVolume)
        .input("currentVoidFillCost", currentVoidFillCost)
        .input("newVoidFillCost", newVoidFillCost)
        .query(`
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
          VALUES (
            @idOrder, @idAttributeData, @idShipmenDataFile, @model, @boxNumber,
            @newAssignedBoxLength, @newAssignedBoxWidth, @newAssignedBoxHeight,
            @currentBoxCorrugateArea, @newBoxCorrugateArea,
            @currentBoxCorrugateCost, @newBoxCorrugateCost,
            @currentDimWeight, @newDimWeight,
            @currentBillableWeight, @newBillableWeight,
            @currentFreightCost, @newFreightCost,
            @currentVoidVolume, @newVoidVolume,
            @currentVoidFillCost, @newVoidFillCost
          )
        `);
    }
  }
}
function computeHeuristicAABBShippingBox(items: { length: number, width: number, height: number }[]) {
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

  // Linear Y
  let yPos = 0;
  const linearY = items.map(item => {
    const placed = { ...item, x: 0, y: yPos, z: 0 };
    yPos += item.width;
    return placed;
  });
  let box = computeAABB(linearY);
  bestBox = box; bestVolume = box.volume;

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
    }
  }

  return bestBox!;
}