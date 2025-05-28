import { RequestHandler } from "express";
import * as repository from '../repository/Results.repository';
import { parseMessageI18n } from '../utils/parse-messga-i18';

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