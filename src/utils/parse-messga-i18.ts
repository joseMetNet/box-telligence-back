export const parseMessageI18n = (message: any, req: any) => {
    //validate message is object
    if (typeof message === 'object') {
        const { translationKey, translationParams } = message;
        return  req.__(translationKey, translationParams);
    }

    return req.__(message)
}