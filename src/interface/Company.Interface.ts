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
    idFreightChargeMethod: number,
    dimWeightFactor: number
    idPackMaterial: number,
    packMaterialCost: number,
    corrugateType: string,
    corrugateCost: number,
    freightCostPerLb: number,
    idOrder?: number,
    idCompany?: number,
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

export interface IGetCompaniesParams {
    page?: number;
    limit?: number;
}