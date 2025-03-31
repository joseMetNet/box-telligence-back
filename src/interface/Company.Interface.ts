export interface ICompany {
    company: string,
    location: string,
    idUser: number,
    currentBoxUsed: number,
    runCurrentBoxKitOnly: boolean,
    minimunNumBox: number,
    maximunNumBox: number,
    orderUsed: boolean,
    weightDataAvailable: boolean,
    idWeightData: number,
    idBoxDimension: number,
    assignedBoxes: boolean,
    itemClearanceRuleUsed: boolean,
    clearanceAmount: number,
    multipleItemsPreCubed: boolean,
    freightChargeMethod: string,
    dimWeightFactor: number
    idPackMaterial: number,
    packMaterialCost: number,
    idCorrugateType: number,
    corrugateCost: number,
    freightCostPerLb: number,
    createAt: Date,
    updateAt: Date
}

export interface ImessageComposed {
    translationKey: string,
    translationParams: object
}

export interface IresponseRepositoryService {
    code: number,
    message:  ImessageComposed | string,
    data?: any
}