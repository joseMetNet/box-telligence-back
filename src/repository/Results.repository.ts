import { connectToSqlServer } from "../DB/config";
import { ShipmentItem, IResultsPaginated, IResult } from "../interface/Results.Interface";

export const runEvenDistributionModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const itemsResult = await db?.request().input("idOrder", idOrder).query(`
      SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC
    `);

  if (
    !itemsResult ||
    !itemsResult.recordset ||
    itemsResult.recordset.length === 0
  )
    throw new Error("No shipment data found for this order");
  const items: ShipmentItem[] = itemsResult.recordset;

  const attrDataResult = await db?.request().input("idOrder", idOrder).query(`
      SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder
    `);

  if (
    !attrDataResult ||
    !attrDataResult.recordset ||
    attrDataResult.recordset.length === 0
  )
    throw new Error("No attribute data found for this order");

  const attrData = attrDataResult.recordset[0];
  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);

  const numBoxesArray: number[] =
    runCurrentBoxKitOnly === 1
      ? [attrData.currentBoxUsed]
      : Array.from(
          { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
          (_, i) => attrData.minimunNumBox + i
        );

  const anchorLength = items[0]["cubedItemLength"];
  const anchorWidth = Math.max(...items.map((item) => item["cubedItemWidth"]));
  const anchorHeight = Math.max(
    ...items.map((item) => item["cubedItemHeight"])
  );

  const dimWeightFactor = attrData.dimWeightFactor;
  const packMaterialCost = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb = attrData.freightCostPerLb;

  for (const numBoxes of numBoxesArray) {
    const segmentSize = Math.floor(items.length / numBoxes);
    let startIdx = 0;

    for (let i = 0; i < numBoxes; i++) {
      const endIdx =
        i === numBoxes - 1 ? items.length - 1 : (i + 1) * segmentSize - 1;
      if (startIdx > endIdx) continue;

      const segmentItems = items.slice(startIdx, endIdx + 1);

      for (const item of segmentItems) {
        const currentArea =
          item.currentAssignedBoxLength *
            (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight) +
          item.currentAssignedBoxWidth *
            (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);

        const newArea =
          anchorLength * (anchorWidth + anchorHeight) +
          anchorWidth * (anchorWidth + anchorHeight);

        const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
        const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

        const currentDimWeight =
          (item.currentAssignedBoxLength *
            item.currentAssignedBoxWidth *
            item.currentAssignedBoxHeight) /
          dimWeightFactor;
        const newDimWeight =
          (anchorLength * anchorWidth * anchorHeight) / dimWeightFactor;

        const currentBillableWeight = Math.max(
          item.cubedItemWeight,
          currentDimWeight
        );
        const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

        const currentFreightCost = currentBillableWeight * freightCostPerLb;
        const newFreightCost = newBillableWeight * freightCostPerLb;

        const currentVoidVolume =
          (item.currentAssignedBoxLength *
            item.currentAssignedBoxWidth *
            item.currentAssignedBoxHeight -
            item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) /
          1728;

        const newVoidVolume =
          (anchorLength * anchorWidth * anchorHeight -
            item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight) /
          1728;

        const currentVoidFillCost = currentVoidVolume * packMaterialCost;
        const newVoidFillCost = newVoidVolume * packMaterialCost;

        await db
          ?.request()
          .input("idOrder", idOrder)
          .input("idAttributeData", attrData.id)
          .input("idShipmenDataFile", item.id)
          .input("model", "EvenDistribution")
          .input("boxNumber", i + 1)
          .input("newAssignedBoxLength", anchorLength)
          .input("newAssignedBoxWidth", anchorWidth)
          .input("newAssignedBoxHeight", anchorHeight)
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
          .input("newVoidFillCost", newVoidFillCost).query(`
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

      startIdx = endIdx + 1;
    }
  }

  return {
    success: true,
    message: "Even Distribution model completed successfully",
  };
};

/* GET ORIGINAL */
// export const getResultsByOrder = async (
//   idOrder: number,
//   page: number = 1,
//   pageSize: number = 10
// ): Promise<IResultsPaginated> => {
//   const db = await connectToSqlServer();
//   if (!db) throw new Error("No se pudo conectar a la base de datos");
//   const offset = (page - 1) * pageSize;

//   const totalResult = await db
//     .request()
//     .input("idOrder", idOrder)
//     .query("SELECT COUNT(*) as total FROM TB_Results WHERE idOrder = @idOrder");
//   const total = totalResult.recordset[0].total;

//   const resultsQuery = await db
//     .request()
//     .input("idOrder", idOrder)
//     .input("pageSize", pageSize)
//     .input("offset", offset)
//     .query(`
//       SELECT r.*, s.orderId, s.item1Length, s.item1Width, s.item1Height, s.item1Weight,
//              s.item2Length, s.item2Width, s.item2Height, s.item2Weight,
//              s.item3Length, s.item3Width, s.item3Height, s.item3Weight,
//              s.item4Length, s.item4Width, s.item4Height, s.item4Weight,
//              s.item5Length, s.item5Width, s.item5Height, s.item5Weight
//       FROM TB_Results r
//       LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
//       WHERE r.idOrder = @idOrder
//       ORDER BY r.id
//       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
//     `);

//   return {
//     results: resultsQuery.recordset,
//     total,
//     page,
//     pageSize,
//     totalPages: Math.ceil(total / pageSize),
//   };
// };

export const getResultsByOrder = async (
  idOrder: number,
  page: number = 1,
  pageSize: number = 10
): Promise<IResultsPaginated> => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");
  const offset = (page - 1) * pageSize;

  // 1. Se Obtenienen los boxNumber únicos para la paginación
  const boxNumbersResult = await db
    .request()
    .input("idOrder", idOrder)
    .input("pageSize", pageSize)
    .input("offset", offset)
    .query(`
      SELECT DISTINCT boxNumber
      FROM TB_Results
      WHERE idOrder = @idOrder
      ORDER BY boxNumber
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
    `);

  const boxNumbers = boxNumbersResult.recordset.map((row: any) => row.boxNumber);

  // 2. Obtener el total de boxNumbers únicos
  const totalBoxNumbersResult = await db
    .request()
    .input("idOrder", idOrder)
    .query(`
      SELECT COUNT(DISTINCT boxNumber) as total
      FROM TB_Results
      WHERE idOrder = @idOrder
    `);
  const total = totalBoxNumbersResult.recordset[0].total;

  // 3. Traer todos los registros de esos boxNumber
  let results: any[] = [];
  if (boxNumbers.length > 0) {
    const inClause = boxNumbers.map((_, i) => `@boxNumber${i}`).join(',');
    const request = db.request().input("idOrder", idOrder);
    boxNumbers.forEach((num, i) => request.input(`boxNumber${i}`, num));
    const resultsQuery = await request.query(`
      SELECT r.*, s.orderId, s.item1Length, s.item1Width, s.item1Height, s.item1Weight,
             s.item2Length, s.item2Width, s.item2Height, s.item2Weight,
             s.item3Length, s.item3Width, s.item3Height, s.item3Weight,
             s.item4Length, s.item4Width, s.item4Height, s.item4Weight,
             s.item5Length, s.item5Width, s.item5Height, s.item5Weight
      FROM TB_Results r
      LEFT JOIN TB_ShipmentDataFile s ON r.idShipmenDataFile = s.id
      WHERE r.idOrder = @idOrder
        AND r.boxNumber IN (${inClause})
      ORDER BY r.boxNumber, r.id
    `);
    results = resultsQuery.recordset;
  }

  // 4. Obtener el total de cajas usadas (COUNT(boxNumber)), min y max boxNumber
  const statsResult = await db
    .request()
    .input("idOrder", idOrder)
    .query(`
      SELECT COUNT(boxNumber) as totalBoxesUsed, 
             MIN(boxNumber) as minBoxNumber, 
             MAX(boxNumber) as maxBoxNumber
      FROM TB_Results
      WHERE idOrder = @idOrder
    `);
  const { totalBoxesUsed, minBoxNumber, maxBoxNumber } = statsResult.recordset[0] || { totalBoxesUsed: 0, minBoxNumber: null, maxBoxNumber: null };

  const summaryCards = [
    { label: 'Current Number of Boxes Used', value: totalBoxesUsed },
    { label: 'Minimum Number of Boxes to Analyze', value: minBoxNumber },
    { label: 'Maximum Number of Boxes to Analyze', value: maxBoxNumber }
  ];

  return {
    results,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    boxNumbers, // puedes devolverlos para referencia y se agrega en la interfaz
    summaryCards,
    totalBoxesUsed,
    minBoxNumber,
    maxBoxNumber,
  };
};



export const runTopFrequenciesModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const itemsResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder ORDER BY cubedItemLength DESC`);

  if (!itemsResult?.recordset?.length)
    throw new Error("No shipment data found for this order");

  const items: ShipmentItem[] = itemsResult.recordset;

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);

  if (!attrDataResult?.recordset?.length)
    throw new Error("No attribute data found for this order");

  const attrData = attrDataResult.recordset[0];
  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);

  const numBoxesArray: number[] = runCurrentBoxKitOnly === 1
    ? [attrData.currentBoxUsed]
    : Array.from(
        { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
        (_, i) => attrData.minimunNumBox + i
      );

  const dimWeightFactor = attrData.dimWeightFactor;
  const packMaterialCost = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb = attrData.freightCostPerLb;

  for (const numBoxes of numBoxesArray) {
    const segmentSize = Math.floor(items.length / numBoxes);
    let startIdx = 0;

    for (let i = 0; i < numBoxes; i++) {
      const endIdx = i === numBoxes - 1 ? items.length - 1 : (i + 1) * segmentSize - 1;
      if (startIdx > endIdx) continue;

      const segmentItems = items.slice(startIdx, endIdx + 1);

      const anchorLength = Math.max(...segmentItems.map(item => item.cubedItemLength));
      const anchorWidth = Math.max(...segmentItems.map(item => item.cubedItemWidth));
      const anchorHeight = Math.max(...segmentItems.map(item => item.cubedItemHeight));

      for (const item of segmentItems) {
        const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)
          + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);

        const newArea = anchorLength * (anchorWidth + anchorHeight)
          + anchorWidth * (anchorWidth + anchorHeight);

        const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
        const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

        const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
        const newDimWeight = (anchorLength * anchorWidth * anchorHeight) / dimWeightFactor;

        const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
        const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

        const currentFreightCost = currentBillableWeight * freightCostPerLb;
        const newFreightCost = newBillableWeight * freightCostPerLb;

        const currentVoidVolume = (
          (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight)
          - (item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
        ) / 1728;

        const newVoidVolume = (
          (anchorLength * anchorWidth * anchorHeight)
          - (item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
        ) / 1728;

        const currentVoidFillCost = currentVoidVolume * packMaterialCost;
        const newVoidFillCost = newVoidVolume * packMaterialCost;

        await db.request()
          .input("idOrder", idOrder)
          .input("idAttributeData", attrData.id)
          .input("idShipmenDataFile", item.id)
          .input("model", "TopFrequencies")
          .input("boxNumber", i + 1)
          .input("newAssignedBoxLength", anchorLength)
          .input("newAssignedBoxWidth", anchorWidth)
          .input("newAssignedBoxHeight", anchorHeight)
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

      startIdx = endIdx + 1;
    }
  }

  return {
    success: true,
    message: "TopFrequencies model completed successfully",
  };
};

export const runEvenVolumeModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const itemsResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder`);

  if (!itemsResult?.recordset?.length)
    throw new Error("No shipment data found for this order");

  const items: ShipmentItem[] = itemsResult.recordset;

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);

  if (!attrDataResult?.recordset?.length)
    throw new Error("No attribute data found for this order");

  const attrData = attrDataResult.recordset[0];
  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);

  const numBoxesArray: number[] = runCurrentBoxKitOnly === 1
    ? [attrData.currentBoxUsed]
    : Array.from(
        { length: attrData.maximunNumBox - attrData.minimunNumBox + 1 },
        (_, i) => attrData.minimunNumBox + i
      );

  const dimWeightFactor = attrData.dimWeightFactor;
  const packMaterialCost = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb = attrData.freightCostPerLb;

  for (const numBoxes of numBoxesArray) {
    const enrichedItems = items.map(item => ({
      ...item,
      itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight,
    }));

    enrichedItems.sort((a, b) => b.itemVolume - a.itemVolume); 

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
    while (segmentStartIndexes.length < numBoxes + 1) {
      segmentStartIndexes.push(enrichedItems.length);
    }

    const segments: ShipmentItem[][] = [];
    for (let i = 0; i < numBoxes; i++) {
      const from = segmentStartIndexes[i];
      const to = segmentStartIndexes[i + 1];
      if (to <= from) continue;
      segments.push(enrichedItems.slice(from, to));
    }

    const anchorBox = segments[0];
    const anchorLength = Math.max(...anchorBox.map(i => i.cubedItemLength));
    const anchorWidth = Math.max(...anchorBox.map(i => i.cubedItemWidth));
    const anchorHeight = Math.max(...anchorBox.map(i => i.cubedItemHeight));

    for (let i = 0; i < segments.length; i++) {
      for (const item of segments[i]) {
        const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)
          + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);

        const newArea = anchorLength * (anchorWidth + anchorHeight)
          + anchorWidth * (anchorWidth + anchorHeight);

        const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
        const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

        const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
        const newDimWeight = (anchorLength * anchorWidth * anchorHeight) / dimWeightFactor;

        const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
        const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

        const currentFreightCost = currentBillableWeight * freightCostPerLb;
        const newFreightCost = newBillableWeight * freightCostPerLb;

        const currentVoidVolume = (
          (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight)
          - (item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
        ) / 1728;

        const newVoidVolume = (
          (anchorLength * anchorWidth * anchorHeight)
          - (item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
        ) / 1728;

        const currentVoidFillCost = currentVoidVolume * packMaterialCost;
        const newVoidFillCost = newVoidVolume * packMaterialCost;

        await db.request()
          .input("idOrder", idOrder)
          .input("idAttributeData", attrData.id)
          .input("idShipmenDataFile", item.id)
          .input("model", "EvenVolume")
          .input("boxNumber", runCurrentBoxKitOnly === 1 ? attrData.currentBoxUsed : attrData.minimunNumBox + i)
          .input("newAssignedBoxLength", anchorLength)
          .input("newAssignedBoxWidth", anchorWidth)
          .input("newAssignedBoxHeight", anchorHeight)
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

  return {
    success: true,
    message: "RunEvenVolume model completed successfully",
  };
};

export const runEvenVolumeDinamicoModel = async (idOrder: number) => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const itemsResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_ShipmentDataFile WHERE idOrder = @idOrder`);

  if (!itemsResult?.recordset?.length)
    throw new Error("No se encontraron datos de envío para esta orden");

  const items: ShipmentItem[] = itemsResult.recordset;

  const attrDataResult = await db.request()
    .input("idOrder", idOrder)
    .query(`SELECT * FROM TB_AttributeData WHERE idOrder = @idOrder`);

  if (!attrDataResult?.recordset?.length)
    throw new Error("No se encontraron datos de atributos para esta orden");

  const attrData = attrDataResult.recordset[0];
  const runCurrentBoxKitOnly = Number(attrData.runCurrentBoxKitOnly);

  const dimWeightFactor = attrData.dimWeightFactor;
  const packMaterialCost = attrData.packMaterialCost;
  const corrugateCostPerSf = attrData.corrugateCost;
  const freightCostPerLb = attrData.freightCostPerLb;

  const referenceSegments = {
    large: 7.5,
    medium: 10,
    small: 15
  };

  const minBox = Number(attrData.minimunNumBox);
  const maxBox = Number(attrData.maximunNumBox);
  const currentBoxUsed = Number(attrData.currentBoxUsed);

  const numBoxesArray = runCurrentBoxKitOnly === 1
    ? [currentBoxUsed]
    : Array.from({ length: maxBox - minBox + 1 }, (_, i) => minBox + i);

  for (const numBoxes of numBoxesArray) {
    const scale = 10 / numBoxes;
    const scaledSegments = {
      large: referenceSegments.large * scale,
      medium: referenceSegments.medium * scale,
      small: referenceSegments.small * scale
    };

    const numLarge = Math.round(numBoxes * 0.3);
    const numMedium = Math.round(numBoxes * 0.3);
    const numSmall = numBoxes - numLarge - numMedium;

    const scaledPercentages = [
      ...Array(numLarge).fill(scaledSegments.large),
      ...Array(numMedium).fill(scaledSegments.medium),
      ...Array(numSmall).fill(scaledSegments.small)
    ];

    const enrichedItems = items.map(item => ({
      ...item,
      itemVolume: item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight,
    }));

    enrichedItems.sort((a, b) => b.itemVolume - a.itemVolume);

    const totalVolume = enrichedItems.reduce((sum, item) => sum + item.itemVolume, 0);

    const breakpoints = scaledPercentages.map((perc, i) =>
      scaledPercentages.slice(0, i + 1).reduce((sum, p) => sum + p, 0) / 100 * totalVolume
    );

    const segments: ShipmentItem[][] = [];
    let startIdx = 0;

    for (let k = 0; k < breakpoints.length; k++) {
      let endIdx = enrichedItems.findIndex((item, idx) =>
        idx >= startIdx && enrichedItems.slice(startIdx, idx + 1).reduce((sum, it) => sum + it.itemVolume, 0) >= breakpoints[k]
      );

      if (endIdx === -1) endIdx = enrichedItems.length - 1;

      segments.push(enrichedItems.slice(startIdx, endIdx + 1));
      startIdx = endIdx + 1;
    }

    for (let j = 0; j < segments.length; j++) {
      const segment = segments[j];
      if (segment.length === 0) continue;

      const maxLength = Math.max(...segment.map(item => item.cubedItemLength));
      const maxWidth = Math.max(...segment.map(item => item.cubedItemWidth));
      const maxHeight = Math.max(...segment.map(item => item.cubedItemHeight));

      const boxLength = Math.max(maxLength, maxWidth);
      const boxWidth = Math.min(maxLength, maxWidth);
      const boxHeight = maxHeight;

      for (const item of segment) {
        const currentArea = item.currentAssignedBoxLength * (item.currentAssignedBoxWidth + item.currentAssignedBoxHeight)
          + item.currentAssignedBoxWidth * (item.currentAssignedBoxHeight + item.currentAssignedBoxWidth);

        const newArea = boxLength * (boxWidth + boxHeight)
          + boxWidth * (boxWidth + boxHeight);

        const currentCorrugateCost = (currentArea / 144) * corrugateCostPerSf;
        const newCorrugateCost = (newArea / 144) * corrugateCostPerSf;

        const currentDimWeight = (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight) / dimWeightFactor;
        const newDimWeight = (boxLength * boxWidth * boxHeight) / dimWeightFactor;

        const currentBillableWeight = Math.max(item.cubedItemWeight, currentDimWeight);
        const newBillableWeight = Math.max(item.cubedItemWeight, newDimWeight);

        const currentFreightCost = currentBillableWeight * freightCostPerLb;
        const newFreightCost = newBillableWeight * freightCostPerLb;

        const currentVoidVolume = (
          (item.currentAssignedBoxLength * item.currentAssignedBoxWidth * item.currentAssignedBoxHeight)
          - (item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
        ) / 1728;

        const newVoidVolume = (
          (boxLength * boxWidth * boxHeight)
          - (item.cubedItemLength * item.cubedItemWidth * item.cubedItemHeight)
        ) / 1728;

        const currentVoidFillCost = currentVoidVolume * packMaterialCost;
        const newVoidFillCost = newVoidVolume * packMaterialCost;

        await db.request()
          .input("idOrder", idOrder)
          .input("idAttributeData", attrData.id)
          .input("idShipmenDataFile", item.id)
          .input("model", "EvenVolumeDinamico")
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

  return {
    success: true,
    message: "Modelo EvenVolumeDinamico ejecutado exitosamente",
  };
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
