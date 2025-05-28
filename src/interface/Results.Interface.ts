export interface ShipmentItem {
  id: number;
  cubedItemLength: number;
  cubedItemWidth: number;
  cubedItemHeight: number;
  cubedItemWeight: number;
  currentAssignedBoxLength: number;
  currentAssignedBoxWidth: number;
  currentAssignedBoxHeight: number;
}

export interface AttributeData {
  id: number;
  idOrder: number;
  currentBoxUsed: number;
  dimWeightFactor: number;
  packMaterialCost: number;
  corrugateCost: number;
  freightCostPerLb: number;
}