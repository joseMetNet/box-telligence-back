import { CustomValidator } from "express-validator";
import { connectToSqlServer } from "../DB/config";

export const validateEmailUserExist = async (email: string) => {
    const db = await connectToSqlServer();
    const result = `SELECT COUNT(*) AS count FROM TB_Users WHERE Email = @Email`;
    const emailCheckResult = await db?.request()
    .input('Email', email)
    .query(result);
  
    const emailExists = emailCheckResult?.recordset[0]?.count > 0
  
    if (emailExists) {
      throw new Error("user.emailExists");
    }
    else {
      return true;
    }
  };

