export interface ShipmentItem {
  id: number;
  cubedItemLength: number;
  cubedItemWidth: number;
  cubedItemHeight: number;
  cubedItemWeight: number;
  currentAssignedBoxLength: number;
  currentAssignedBoxWidth: number;
  currentAssignedBoxHeight: number;
  cubingMethod: string;
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

export interface IResult {
    id: number;
    idOrder: number;
    idAttributeData: number;
    idShipmenDataFile: number;
    model: string;
    boxNumber: number;
    newAssignedBoxLength: number;
    newAssignedBoxWidth: number;
    newAssignedBoxHeight: number;
    currentBoxCorrugateArea: number;
    newBoxCorrugateArea: number;
    currentBoxCorrugateCost: number;
    newBoxCorrugateCost: number;
    currentDimWeight: number;
    newDimWeight: number;
    currentBillableWeight: number;
    newBillableWeight: number;
    currentFreightCost: number;
    newFreightCost: number;
    currentVoidVolume: number;
    newVoidVolume: number;
    currentVoidFillCost: number;
    newVoidFillCost: number;
    orderId: number;
    item1Length: number;
    item1Width: number;
    item1Height: number;
    item1Weight: number;
    item2Length: number;
    item2Width: number;
    item2Height: number;
    item2Weight: number;
    item3Length: number;
    item3Width: number;
    item3Height: number;
    item3Weight: number;
    item4Length: number;
    item4Width: number;
    item4Height: number;
    item4Weight: number;
    item5Length: number;
    item5Width: number;
    item5Height: number;
    item5Weight: number;
}

export interface IResultsPaginated {
    // Agrupación por modelo
    models: {
        model: string;
        results: IResult[];
        boxNumbers: number[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        summaryCards: { label: string; value: number | null }[];
        totalBoxesUsed: number;
        minBoxNumber: number | null;
        maxBoxNumber: number | null;
    }[];

    // results: IResult[];
    // total: number;
    // page: number;
    // pageSize: number;
    // totalPages: number;
    // boxNumbers: number[];
    // summaryCards: { label: string; value: number | null }[];
    // totalBoxesUsed: number; // total number of boxes used (COUNT(boxNumber))
    // minBoxNumber: number | null; // minimum boxNumber for the idOrder
    // maxBoxNumber: number | null; // maximum boxNumber for the idOrder
}

export interface IExistsResultResponse {
    exists: 1 | 0;
}

export interface IValidateResultResponse {
    exists: 1 | 0;
}

export type Boundary = { start: number; end: number };

export type DistOptions = {
  useKitFromTable?: boolean;
};