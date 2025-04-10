import { RequestHandler } from "express";
import * as repository from '../repository/Company.Repository';
import { parseMessageI18n } from '../utils/parse-messga-i18';
import { IresponseRepositoryService } from "../interface/Company.Interface";


export const createCompanyController: RequestHandler = async (req, res) => {
    try {
        const { code, message, ...resto }: IresponseRepositoryService = await repository.createCompany(req.body);
        res.status(code).json({ message: parseMessageI18n(message, req), ...resto });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};

export const getNewCompaniesController: RequestHandler = async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const safePage = page > 0 ? page : 1;
        const safeLimit = limit > 0 ? limit : 10;
        const { code, message, ...resto }: IresponseRepositoryService = await repository.getNewCompanies({page: safePage, limit: safeLimit});
        res.status(code).json({message: parseMessageI18n(message, req), ...resto });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};

export const getOlderCompaniesController: RequestHandler = async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const safePage = page > 0 ? page : 1;
        const safeLimit = limit > 0 ? limit : 10;
        const { code, message, ...resto }: IresponseRepositoryService = await repository.getOlderCompanies({page: safePage, limit: safeLimit});
        res.status(code).json({message: parseMessageI18n(message, req), ...resto });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};

export const getCompaniesController: RequestHandler = async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const safePage = page > 0 ? page : 1;
        const safeLimit = limit > 0 ? limit : 10;
        const { code, message, ...resto }: IresponseRepositoryService = await repository.getCompanies({page: safePage, limit: safeLimit});
        res.status(code).json({message: parseMessageI18n(message, req), ...resto });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};
