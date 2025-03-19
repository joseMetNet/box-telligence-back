export interface dataLogin{
    email: string,
    password: string
}

export interface IresponseRepositoryService{
    code: number,
    message: string | { translationKey: string },
    data?:any
}
