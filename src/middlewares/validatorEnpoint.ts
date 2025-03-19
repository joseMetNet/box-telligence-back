import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { parseMessageI18n } from "../utils/parse-messga-i18";
import { connectToSqlServer } from "../DB/config";

export const validateEnpoint = (req: Request, res: Response, next: any) => {
  const error: any = validationResult(req);
  if (!error.isEmpty()) {
    const data = error.errors.map((item: any) => ({
      ...item,
      msg: parseMessageI18n(item.msg, req),
    }));

    return res
      .status(400)
      .json({ code: 400, message: parseMessageI18n("global.error_routes", req), data });
  }
  next();
};

export const checkExistingEmail = async (req: Request, res: Response, next: any) => {
  const { email } = req.body;
  try {
    const db = await connectToSqlServer();
    const checkEmailQuery = `
      SELECT COUNT(*) AS count FROM TB_User WHERE Email = @Email
    `;
    const emailCheckResult = await db?.request()
      .input('Email', email)
      .query(checkEmailQuery);

    const emailExists = emailCheckResult?.recordset[0]?.count > 0;
    if (emailExists) {
      return res.status(400).json({
        error: 'El correo electrónico ya existe'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Error al verificar el correo electrónico'
    });
  }
};

