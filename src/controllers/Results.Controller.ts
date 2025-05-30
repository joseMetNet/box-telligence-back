import { RequestHandler } from "express";
import * as repository from '../repository/Results.repository';
import { parseMessageI18n } from '../utils/parse-messga-i18';
import { IExistsResultResponse, IValidateResultResponse } from "../interface/Results.Interface";

export const runEvenDistributionModelController: RequestHandler = async (req, res) => {
  try {
    const { idOrder } = req.body;

    if (!idOrder) {
      return res.status(400).json({ message: parseMessageI18n("missing_idOrder", req) });
    }

    const result = await repository.runEvenDistributionModel(idOrder);
    res.status(200).json({
      ...result,
      message: parseMessageI18n("even_distribution_completed", req),
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: parseMessageI18n("error_server", req),
      error: err.message,
    });
  }
};

export const getResultsByOrderController: RequestHandler = async (req, res) => {
  try {
    const idOrder = Number(req.query.idOrder || req.params.idOrder);
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    if (isNaN(idOrder)) {
      return res.status(400).json({ message: "idOrder is required and must be a number" });
    }
    const data = await repository.getResultsByOrder(idOrder, page, pageSize);
    res.status(200).json({ message: parseMessageI18n("results.found", req), ...data });
  } catch (err) {
    console.log("Error in getResultsByOrderController", err);
    res.status(500).json({ message: parseMessageI18n("error_server", req) });
  }
};

export const runTopFrequenciesModelController: RequestHandler = async (req, res) => {
  try {
    let idOrder = req.body.idOrder;

    if (typeof idOrder === "object" && idOrder !== null) {
      idOrder = idOrder.value || idOrder.id || JSON.stringify(idOrder);
    }

    if (!idOrder || isNaN(Number(idOrder))) {
      return res.status(400).json({ message: parseMessageI18n("missing_idOrder", req) });
    }

    const result = await repository.runTopFrequenciesModel(Number(idOrder));
    res.status(200).json({
      ...(typeof result === "object" && result !== null ? result : { result }),
      message: parseMessageI18n("top_frecuencies_completed", req),
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: parseMessageI18n("error_server", req),
      error: err.message,
    });
  }
};

export const runEvenVolumeModelController: RequestHandler = async (req, res) => {
  try {
    const { idOrder } = req.body;

    if (!idOrder) {
      return res.status(400).json({ message: parseMessageI18n("missing_idOrder", req) });
    }

    const result = await repository.runEvenVolumeModel(idOrder);
    res.status(200).json({
      ...result,
      message: parseMessageI18n("even_Volume_completed", req),
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: parseMessageI18n("error_server", req),
      error: err.message,
    });
  }
};

export const runEvenVolumeDinamicoModelController: RequestHandler = async (req, res) => {
  try {
    const { idOrder } = req.body;

    if (!idOrder) {
      return res.status(400).json({ message: parseMessageI18n("missing_idOrder", req) });
    }

    const result = await repository.runEvenVolumeDinamicoModel(idOrder);
    res.status(200).json({
      ...result,
      message: parseMessageI18n("even_Volume_completed", req),
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: parseMessageI18n("error_server", req),
      error: err.message,
    });
  }
};

export const existsResultsByOrderController: RequestHandler = async (req, res) => {
  try {
    const idOrder = Number(req.query.idOrder || req.params.idOrder);
    if (isNaN(idOrder)) {
      return res.status(400).json({ message: "idOrder is required and must be a number" });
    }
    const exists = await repository.existsResultsByOrder(idOrder);
    const response: IExistsResultResponse = { exists };
    res.status(200).json(response);
  } catch (err) {
    console.log("Error in existsResultsByOrderController", err);
    res.status(500).json({ message: parseMessageI18n("error_server", req) });
  }
};

export const getValidateResultsByOrderController: RequestHandler = async (req, res) => {
  try {
    const idOrder = Number(req.query.idOrder || req.params.idOrder);
    if (isNaN(idOrder)) {
      return res.status(400).json({ message: "idOrder is required and must be a number" });
    }
    const exists = await repository.getValidateResultsByOrder(idOrder);
    const response: IValidateResultResponse = { exists };
    res.status(200).json(response);
  } catch (err) {
    console.log("Error in getValidateResultsByOrderController", err);
    res.status(500).json({ message: parseMessageI18n("error_server", req) });
  }
};