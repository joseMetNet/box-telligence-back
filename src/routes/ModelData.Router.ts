import { Router } from "express";
import { createResultModelOne } from "../controllers/ModelOne.Controller";

const modelDataRouter = Router();

/**
 * @swagger
 * /model-one:
 *   post:
 *     tags:
 *       - ModelOne
 *     summary: Ejecuta la lógica de segmentación de cajas (ModelOne)
 *     description: Recibe los datos de orden y retorna la segmentación de cajas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idOrder:
 *                 type: number
 *               idAttributeData:
 *                 type: number
 *               boxNumber:
 *                 type: number
 *               dataOrden:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     Cubed Item Length:
 *                       type: number
 *                     Cubed Item Width:
 *                       type: number
 *                     Cubed Item Height:
 *                       type: number
 *     responses:
 *       200:
 *         description: Segmentación exitosa
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
 *                       Box:
 *                         type: string
 *                       Length:
 *                         type: number
 *                       Width:
 *                         type: number
 *                       Height:
 *                         type: number
 *                       FromRow:
 *                         type: number
 *                       ToRow:
 *                         type: number
 *       400:
 *         description: Error en la petición
 *       500:
 *         description: Error interno del servidor
 */
modelDataRouter.post("/model-one", createResultModelOne);

export default modelDataRouter;