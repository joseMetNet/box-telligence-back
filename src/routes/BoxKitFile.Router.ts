import { Router } from "express";
import { downloadExcelTemplateBoxKitFileController, uploadExcelBoxKitFileController } from "../controllers/BoxKitFile.Controller";

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

/**
 * @swagger
 * /uploadBoxKitFile:
 *   post:
 *     summary: Upload Excel file with BoxKit data
 *     description: Upload an Excel file containing `boxNumber`, `length`, `width`, and `height` to save into `TB_BoxKitFile`. Also, associates the data with a company using `idCompany`.
 *     tags:
 *       - BoxKitFile
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file containing the BoxKit data.
 *               idCompany:
 *                 type: integer
 *                 description: ID of the company to associate the records with.
 *     responses:
 *       200:
 *         description: File uploaded and data saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                     translationParams:
 *                       type: object
 *                       properties:
 *                         insertedRows:
 *                           type: integer
 *       400:
 *         description: Invalid file, missing file, or missing idCompany
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
boxkitFileRouter.post('/uploadBoxKitFile', uploadExcelBoxKitFileController);

export default boxkitFileRouter;