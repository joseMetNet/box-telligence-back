import { Router } from "express";
import { downloadExcelTemplateShipmentDataFileController } from "../controllers/ShipmentDataFile.Controller";

const shipmentDataFileRouter = Router();

/**
 * @swagger
 * /downloadTemplateShipmentDataFile:
 *   get:
 *     summary: Download template
 *     description: Returns an Excel file with the columns `Order ID`, `Item 1 Length`, `Item 1 Width`, `Item 1 Height` , `Item 1 Weight`, `Item 2 Length`, `Item 2 Width`, `Item 2 Height` , `Item 2 Weight`, `Item 3 Length`, `Item 3 Width`, `Item 3 Height` , `Item 3 Weight`, `Item 4 Length`, `Item 4 Width`, `Item 4 Height` , `Item 4 Weight`, `Item 5 Length`, `Item 5 Width`, `Item 5 Height` , `Item 5 Weight`, `Cubed Item Length`, `Cubed Item Width`, `Cubed Item Height`, `Cubed Item Weight`, `Current Assigned Box Length`, `Current Assigned Box Width` and `Current Assigned Box Height`.
 *     tags:
 *       - ShipmentDataFile
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
shipmentDataFileRouter.get('/downloadTemplateShipmentDataFile', downloadExcelTemplateShipmentDataFileController);

export default shipmentDataFileRouter;