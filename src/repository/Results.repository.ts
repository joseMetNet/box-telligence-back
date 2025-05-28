import { connectToSqlServer } from "../DB/config";
import { ShipmentItem } from "../interface/Results.Interface";

export const runEvenDistributionModel = async (idOrder: number) => {
  const db = await connectToSqlServer();

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
