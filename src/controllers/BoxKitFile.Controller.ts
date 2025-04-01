import { RequestHandler } from "express";
import * as repository from '../repository/BoxKitFile.Repository';
import { IresponseRepositoryService } from "../interface/BoxKitFile.Interface";
import { parseMessageI18n } from "../utils/parse-messga-i18";

export const downloadExcelTemplateBoxKitFileController: RequestHandler =  async (req, res) => {
    try {
        const { code, message, data }: IresponseRepositoryService = await repository.generateExcelTemplateBoxKitFile();
        if (code !== 200) {
        return res.status(code).json({ message });
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=BoxKitFile.xlsx');
        res.send(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};