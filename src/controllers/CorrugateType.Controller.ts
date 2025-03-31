import { RequestHandler } from "express";
import * as repository from '../repository/CorrugateType.Repository';
import { parseMessageI18n } from '../utils/parse-messga-i18';
import { IresponseRepositoryService } from "../interface/CorrugateType.Interface";

export const getCorrugateTypeController: RequestHandler = async (req, res) => {
    try {
        const { code, message, ...resto }: IresponseRepositoryService = await repository.getCorrugateType();
        res.status(code).json({ message: parseMessageI18n(message, req), ...resto });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};
