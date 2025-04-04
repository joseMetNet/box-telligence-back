import { RequestHandler } from "express";
import * as repository from '../repository/BoxKitFile.Repository';
import { IresponseRepositoryService } from "../interface/BoxKitFile.Interface";
import { parseMessageI18n } from "../utils/parse-messga-i18";
import { UploadedFile } from "express-fileupload";

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
export const uploadExcelBoxKitFileController: RequestHandler = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ message: parseMessageI18n("templateFileNotFound", req) });
        }

        const file = req.files.file as UploadedFile;

        if (!file.data || file.data.length === 0) {
            return res.status(400).json({ message: parseMessageI18n("error_empty_file", req) });
        }

        const { idCompany } = req.body;
        if (!idCompany) {
            return res.status(400).json(parseMessageI18n("The idCompany is mandatory", req) );
        }

        const response = await repository.uploadExcelBoxKitFile(file.data, Number(idCompany));

        return res.status(response.code).json(response);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};