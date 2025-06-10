import { Router } from "express";
import { downloadExcelTemplateShipmentDataFileController, getItemsLargestAspectRatioByIdOrderController, uploadExcelShipmentDataFileController } from "../controllers/ShipmentDataFile.Controller";

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

/**
 * @swagger
 * /uploadShipmentDataFile:
 *   post:
 *     summary: Upload Excel file with shipment data file
 *     description: Upload an Excel file containing the shipment data. Also, associates the data with a company using `idCompany`.
 *     tags:
 *       - ShipmentDataFile
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
 *                 description: Excel file containing the shipment data.
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
shipmentDataFileRouter.post('/uploadShipmentDataFile', uploadExcelShipmentDataFileController);

/**
 * @swagger
 * /items-largest-aspect-ratio/{idOrder}:
 *   get:
 *     summary: Get Top 10 Largest Items by Aspect Ratio
 *     description: Returns the top 10 largest items (by area = length × width) across up to 5 items per record for a given order ID. Includes aspect ratio (length / width) and source item details.
 *     tags:
 *       - Results
 *     parameters:
 *       - in: path
 *         name: idOrder
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to retrieve items from
 *     responses:
 *       200:
 *         description: List of top 10 largest items with aspect ratio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idOrder:
 *                         type: integer
 *                       orderId:
 *                         type: string
 *                       idShipmenDataFile:
 *                         type: integer
 *                       itemNumber:
 *                         type: string
 *                       itemLength:
 *                         type: number
 *                       itemWidth:
 *                         type: number
 *                       itemHeight:
 *                         type: number
 *                       itemWeight:
 *                         type: number
 *                       aspectRatio:
 *                         type: number
 *                       itemArea:
 *                         type: number
 *       400:
 *         description: Missing idOrder or invalid input
 *       500:
 *         description: Internal server error
 */
shipmentDataFileRouter.get('/items-largest-aspect-ratio/:idOrder', getItemsLargestAspectRatioByIdOrderController);

/**
 * @swagger
 * /items-largest-void-volume/{idOrder}:
 *   get:
 *     summary: Get Top 10 Items with Largest Boxed Void Volume
 *     description: Returns the top 10 items with the largest void volume (difference between assigned box volume and item volume) for a given order ID.
 *     tags:
 *       - Results
 *     parameters:
 *       - in: path
 *         name: idOrder
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the order to retrieve void volume data from
 *     responses:
 *       200:
 *         description: List of top 10 items with largest void volume
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idOrder:
 *                         type: integer
 *                       orderId:
 *                         type: string
 *                       idShipmenDataFile:
 *                         type: integer
 *                       itemNumber:
 *                         type: string
 *                       itemLength:
 *                         type: number
 *                       itemWidth:
 *                         type: number
 *                       itemHeight:
 *                         type: number
 *                       itemWeight:
 *                         type: number
 *                       currentAssignedBoxLength:
 *                         type: number
 *                       currentAssignedBoxWidth:
 *                         type: number
 *                       currentAssignedBoxHeight:
 *                         type: number
 *                       voidVolume:
 *                         type: number
 *       400:
 *         description: Missing or invalid idOrder
 *       500:
 *         description: Internal server error
 */
shipmentDataFileRouter.get('/items-largest-void-volume/:idOrder', getItemsLargestAspectRatioByIdOrderController);

export default shipmentDataFileRouter;