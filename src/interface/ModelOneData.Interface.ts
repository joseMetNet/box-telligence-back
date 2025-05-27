export interface ImessageComposed {
    translationKey: string,
    translationParams: object
}

export interface IresponseRepositoryService {
    code: number,
    message: ImessageComposed | string,
    data?: any
}

export interface Iresult {
    id: number,
    idOrder: number,
    idAttributeData: number,
    boxNumber: number,
    resultValue: number,
}

export interface DataOrdenItem {
    'Cubed Item Length': number;
    'Cubed Item Width': number;
    'Cubed Item Height': number;
    // ...otros campos si es necesario...
}

export interface BoxResult {
    Box: string;
    Length: number;
    Width: number;
    Height: number;
    FromRow: number;
    ToRow: number;
}

export interface IModelOneRequest {
    idOrder: number;
    idAttributeData: number;
    boxNumber: number;
    dataOrden: DataOrdenItem[];
}

export interface IModelOneResponse extends IresponseRepositoryService {
    data?: BoxResult[];
}

// Esta interfaz representa un registro individual para guardar en TB_Results
export interface IResultInsert {
    idOrder: number;
    idAttributeData: number;
    boxNumber: number;
    resultValue: number;
}