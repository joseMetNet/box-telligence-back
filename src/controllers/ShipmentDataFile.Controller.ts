import { RequestHandler } from "express";
import * as repository from '../repository/ShipmentDataFile.Repository';
import { IresponseRepositoryService } from "../interface/BoxKitFile.Interface";
import { parseMessageI18n } from "../utils/parse-messga-i18";
import { UploadedFile } from "express-fileupload";

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

export const uploadExcelShipmentDataFileController: RequestHandler = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ message: parseMessageI18n("excel.templateFileNotFound", req) });
        }

        const file = req.files.file as UploadedFile;

        if (!file.data || file.data.length === 0) {
            return res.status(400).json({ message: parseMessageI18n("excel.error_empty_file", req) });
        }

        const { idCompany } = req.body;
        if (!idCompany) {
            return res.status(400).json(parseMessageI18n("excel.required_field_text", req) );
        }

        const response = await repository.uploadExcelShipmentDataFile(file.data, Number(idCompany));

        return res.status(response.code).json(response);

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: parseMessageI18n("error_server", req) });
    }
};

export const getItemsLargestAspectRatioByIdOrderController: RequestHandler = async (req, res) => {
  try {
    const idOrder = Number(req.params.idOrder || req.body.idOrder);
    if (!idOrder) {
      return res.status(400).json({
        message: parseMessageI18n("missing_idOrder", req),
      });
    }

    const data = await repository.getItemsLargestAspectRatioByIdOrder(idOrder);

    res.status(200).json({
      code: 200,
      message: parseMessageI18n("items_largest_aspect_ratio_success", req),
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: parseMessageI18n("error_server", req),
    });
  }
};

export const getItemsLargestVoidVolumeByIdOrderController: RequestHandler = async (req, res) => {
  try {
    const idOrder = Number(req.params.idOrder || req.body.idOrder);
    if (!idOrder) {
      return res.status(400).json({
        message: parseMessageI18n("missing_idOrder", req),
      });
    }

    const data = await repository.getItemsLargestVoidVolumeByIdOrder(idOrder);

    res.status(200).json({
      code: 200,
      message: parseMessageI18n("items_largest_void_volume_success", req),
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: parseMessageI18n("error_server", req),
    });
  }
};