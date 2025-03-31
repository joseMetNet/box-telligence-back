import { Router } from "express";
import { getCorrugateTypeController } from "../controllers/CorrugateType.Controller";



const corrugateTypeRouter = Router();

/**
 * @swagger
 * /corrugateType:
 *   get:
 *     tags:
 *       - Corrugate Type
 *     summary: Retrieve all corrugate type
 *     description: Returns a list of all corrugate type available in the system.
 *     responses:
 *       200:
 *         description: Successfully retrieved corrugate type
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
 *                       example: corrugateType.found
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       type:
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
corrugateTypeRouter.get("/corrugateType", getCorrugateTypeController);

export default corrugateTypeRouter;
