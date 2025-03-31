import { Router } from "express";
import { getPackMaterialTypeController } from "../controllers/PackMaterialType.Controller";


const packMaterialTypeRouter = Router();

/**
 * @swagger
 * /packMaterialType:
 *   get:
 *     tags:
 *       - Pack Material Type
 *     summary: Retrieve all pack material type
 *     description: Returns a list of all pack material type in the system.
 *     responses:
 *       200:
 *         description: Successfully retrieved pack material type
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
 *                       example: packMaterialType.found
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       material:
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
packMaterialTypeRouter.get("/packMaterialType", getPackMaterialTypeController);

export default packMaterialTypeRouter;
