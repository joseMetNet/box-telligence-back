export interface dataUser {
    identification: string,
    name: string,
    lastName: string,
    email: String,
    password: string,
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