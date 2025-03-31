import { Router } from "express";
import { getWeightDataController } from "../controllers/WeightData.Controller";

const weightDataRouter = Router();

/**
 * @swagger
 * /weightData:
 *   get:
 *     tags:
 *       - Weight Data 
 *     summary: Retrieve all weight data
 *     description: Returns a list of all weight data available in the system.
 *     responses:
 *       200:
 *         description: Successfully retrieved weight data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: weightData.found
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       measure:
 *                         type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
weightDataRouter.get("/weightData", getWeightDataController);

export default weightDataRouter;
