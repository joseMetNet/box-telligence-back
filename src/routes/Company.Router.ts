import { Router } from "express";
import { body } from "express-validator";
import { validateEnpoint } from "../middlewares/validatorEnpoint";
import { createCompanyController } from "../controllers/Company.Controller";

const companyRouter = Router();

/**
 * @swagger
 * /createCompany:
 *   post:
 *     tags:
 *       - Companies
 *     summary: Add a new company
 *     description: Add a new company to the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company:
 *                 type: string
 *               location:
 *                 type: string
 *               idUser:
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
 *               freightChargeMethod:
 *                 type: string
 *               dimWeightFactor:
 *                 type: number
 *               idPackMaterial:
 *                 type: number
 *               packMaterialCost:
 *                 type: number
 *               idCorrugateType:
 *                 type: number
 *               corrugateCost:
 *                 type: number
 *               freightCostPerLb:
 *                 type: number
 *     responses:
 *       200:
 *         description: Company added successfully
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
 *                       example: company.created
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
 *                       example: company.error_invalid_data
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
companyRouter.post("/createCompany",
    [
        body("company", "company.required_field_text").isString().notEmpty(),
        body("location", "company.required_field_text").isString().notEmpty(),
        body("idUser", "company.required_field_text").isInt().notEmpty(),
        body("currentBoxUsed").isInt(),
        body("runCurrentBoxKitOnly").isBoolean(),
        body("minimunNumBox").isInt(),
        body("maximunNumBox").isInt(),
        body("orderUsed").isBoolean(),
        body("weightDataAvailable").isBoolean(),
        body("idWeightData").isInt(),
        body("idBoxDimension").isInt(),
        body("assignedBoxes").isBoolean(),
        body("itemClearanceRuleUsed").isBoolean(),
        body("clearanceAmount").isFloat(),
        body("multipleItemsPreCubed").isBoolean(),
        body("freightChargeMethod").isString(),
        body("dimWeightFactor").isInt(),
        body("idPackMaterial").isInt(),
        body("packMaterialCost").isFloat(),
        body("idCorrugateType").isInt(),
        body("corrugateCost").isFloat(),
        body("freightCostPerLb").isFloat(),
        validateEnpoint
    ],
    createCompanyController
);

export default companyRouter;
