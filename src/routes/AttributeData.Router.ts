import e, { Router } from "express";
import { body } from "express-validator";
import { validateEnpoint } from "../middlewares/validatorEnpoint";
import { createAttributeDataController } from "../controllers/Company.Controller";

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

export default attributeDataRouter;