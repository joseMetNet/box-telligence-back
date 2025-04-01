import { RequestHandler } from "express";
import * as repository from '../repository/ShipmentDataFile.Repository';
import { IresponseRepositoryService } from "../interface/BoxKitFile.Interface";
import { parseMessageI18n } from "../utils/parse-messga-i18";

export const downloadExcelTemplateShipmentDataFileController: RequestHandler =  async (req, res) => {
    try {
        const { code, message, data }: IresponseRepositoryService = await repository.generateExcelTemplateShipmentDataFile();
        if (code !== 200) {
        return res.status(code).json({ message });
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=ShipmentDataFile.xlsx');
        res.send(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};