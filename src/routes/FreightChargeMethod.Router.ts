import { Router } from "express";
import { getFreightChargeMethodController } from "../controllers/FreightChargeMethod.Controller";



const freightChargeMethodRouter = Router();

/**
 * @swagger
 * /freightChargeMethod:
 *   get:
 *     tags:
 *       - Freight - Charge - Method
 *     summary: Retrieve all freight charge method
 *     description: Returns a list of all freight charge method available in the system.
 *     responses:
 *       200:
 *         description: Successfully retrieved freight charge method
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
 *                       example: freightChargeMethod.found
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       freight:
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
freightChargeMethodRouter.get("/freightChargeMethod", getFreightChargeMethodController);

export default freightChargeMethodRouter;
