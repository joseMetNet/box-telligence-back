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

export const createAttributeDataController: RequestHandler = async (req, res) => {
    try {
        const { code, message, ...resto }: IresponseRepositoryService = await repository.createAttributeData(req.body);
        res.status(code).json({ message: parseMessageI18n(message, req), ...resto });
    } catch (err) {
        console.log("Error en createAttributeDataController", err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};

export const getAttributeDataByOrderController: RequestHandler = async (req, res) => {
  try {
    const raw = (req.params.idOrder ?? req.query.idOrder) as string;
    const idOrder = Number(raw);

    if (!raw || Number.isNaN(idOrder) || idOrder <= 0) {
      return res.status(400).json({
        message: parseMessageI18n("attributeData.missing_or_invalid_idOrder", req),
      });
    }

    const { code, message, ...rest } = await repository.getAttributeDataByOrder(idOrder);
    return res.status(code).json({ message: parseMessageI18n(message, req), ...rest });
  } catch (err) {
    console.error("Error in getAttributeDataByOrderController", err);
    return res.status(500).json({
      message: parseMessageI18n("attributeData.error_server", req),
    });
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

export const getCompanyByIdController: RequestHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: parseMessageI18n("companies.invalid_id", req) });
        }
        const { code, message, ...resto }: IresponseRepositoryService = await repository.getCompaniesById( {id} );
        res.status(code).json({message: parseMessageI18n(message, req), ...resto });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
}

export const getDataFilesCompaniesByIdController: RequestHandler = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: parseMessageI18n("companies.invalid_id", req) });
        }
        const { code, message, ...resto }: IresponseRepositoryService = await repository.getDataFilesCompaniesById( {id} );
        res.status(code).json({message: parseMessageI18n(message, req), ...resto });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
}

export const getCompanyFileDetailsByDate: RequestHandler = async (req, res) => {
    try {
        const { id, fileType, uploadDate, page = 1, pageSize = 10 } = req.query;

        const pageNumber = Number(page);
        const pageSizeNumber = Number(pageSize);

        const { code, message, ...resto }: IresponseRepositoryService = await repository.getCompanyFileDetailsByDate({
            id: Number(id),
            fileType: String(fileType),
            uploadDate: String(uploadDate),
            page: pageNumber,
            limit: pageSizeNumber,
        });
        res.status(code).json({ message: parseMessageI18n(message, req), ...resto });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};

export const deleteFileCompanyController: RequestHandler = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: parseMessageI18n("companies.invalid_id", req) });
    }

    const { code, message, ...resto }: IresponseRepositoryService = await repository.deleteFileCompany({ id });

    return res.status(code).json({ message: parseMessageI18n(message, req), ...resto });
  } catch (err) {
    console.error("Error in deleteFileCompanyController:", err);
    return res.status(500).json({ message: parseMessageI18n("error_server", req) });
  }
};