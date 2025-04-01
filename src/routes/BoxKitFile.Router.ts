import { Router } from "express";
import { downloadExcelTemplateBoxKitFileController } from "../controllers/BoxKitFile.Controller";

const boxkitFileRouter = Router();

/**
 * @swagger
 * /downloadTemplateBoxKitFile:
 *   get:
 *     summary: Download template
 *     description: Returns an Excel file with the columns `box Number`, `length`, `width` and `height`.
 *     tags:
 *       - BoxKitFile
 *     responses:
 *       200:
 *         description: Excel file generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Error generating Excel template
 */
boxkitFileRouter.get('/downloadTemplateBoxKitFile', downloadExcelTemplateBoxKitFileController);

export default boxkitFileRouter;