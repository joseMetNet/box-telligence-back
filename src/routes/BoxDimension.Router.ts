import { Router } from "express";
import { getBoxDimensionsController } from "../controllers/BoxDimension.Controller";


const boxDimensionRouter = Router();

/**
 * @swagger
 * /box-dimensions:
 *   get:
 *     tags:
 *       - Box Dimensions
 *     summary: Retrieve all box dimensions
 *     description: Returns a list of all box dimensions available in the system.
 *     responses:
 *       200:
 *         description: Successfully retrieved box dimensions
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
 *                       example: boxDimension.found
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       boxDimension:
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
boxDimensionRouter.get("/box-dimensions", getBoxDimensionsController);

export default boxDimensionRouter;
