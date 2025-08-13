import e, { Router } from "express";
import { body } from "express-validator";
import { validateEnpoint } from "../middlewares/validatorEnpoint";
import { createAttributeDataController, getAttributeDataByOrderController } from "../controllers/Company.Controller";

const attributeDataRouter = Router();
/**
 * @swagger
 * /createAttributeData:
 *   post:
 *     tags:
 *       - Attribute Data
 *     summary: Create attribute data for a company
 *     description: Creates configuration data related to a company after it's been created.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idCompany:
 *                 type: number
 *               currentBoxUsed:
 *                 type: number
 *               runCurrentBoxKitOnly:
 *                 type: boolean
 *               minimunNumBox:
 *                 type: number
 *               maximunNumBox:
 *                 type: number
 *               orderUsed:
 *                 type: boolean
 *               weightDataAvailable:
 *                 type: boolean
 *               idWeightData:
 *                 type: number
 *               idBoxDimension:
 *                 type: number
 *               assignedBoxes:
 *                 type: boolean
 *               itemClearanceRuleUsed:
 *                 type: boolean
 *               clearanceAmount:
 *                 type: number
 *               multipleItemsPreCubed:
 *                 type: boolean
 *               idFreightChargeMethod:
 *                 type: number
 *               dimWeightFactor:
 *                 type: number
 *               idPackMaterial:
 *                 type: number
 *               packMaterialCost:
 *                 type: number
 *               corrugateType:
 *                 type: string
 *               corrugateCost:
 *                 type: number
 *               freightCostPerLb:
 *                 type: number
 *     responses:
 *       200:
 *         description: Attribute data created successfully
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
 *                       example: attributeData.created
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: attributeData.error_creating
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
attributeDataRouter.post("/createAttributeData", createAttributeDataController);

/**
 * @swagger
 * /attribute-data/{idOrder}:
 *   get:
 *     tags:
 *       - Attribute Data
 *     summary: Obtener AttributeData por idOrder
 *     description: Retorna los registros de la tabla TB_AttributeData asociados al idOrder.
 *     parameters:
 *       - in: path
 *         name: idOrder
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Identificador de la orden.
 *     responses:
 *       200:
 *         description: Registros encontrados (o arreglo vacío si no hay coincidencias)
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
 *                       example: attributeData.found
 *                     translationParams:
 *                       type: object
 *                       example: { "name": "getAttributeDataByOrder" }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *                   example:
 *                     - id: 101
 *                       idOrder: 55
 *                       runCurrentBoxKitOnly: 1
 *                       minimunNumBox: 8
 *                       maximunNumBox: 12
 *                       dimWeightFactor: 139
 *                       createAt: "2025-07-15T12:34:56.000Z"
 *       400:
 *         description: Parámetro idOrder faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: attributeData.missing_or_invalid_idOrder
 *                     translationParams:
 *                       type: object
 *                       example: {}
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: attributeData.error_server
 *                     translationParams:
 *                       type: object
 *                       example: {}
 */
attributeDataRouter.get("/attribute-data/:idOrder", getAttributeDataByOrderController);

export default attributeDataRouter;