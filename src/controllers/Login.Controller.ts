import { RequestHandler } from "express";
import * as repository from "../repository/Login.Repository";
import { IresponseRepositoryService } from "../interface/Login.Interface";
import { parseMessageI18n } from "../utils/parse-messga-i18";

export const login: RequestHandler = async(req, res) => {
    try {
        const { code, message, ...resto}: IresponseRepositoryService = await repository.loginUser(req.body);
        res.status(code).json({message: parseMessageI18n(message, req), ...resto});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: parseMessageI18n('error_server', req)});
    }
}