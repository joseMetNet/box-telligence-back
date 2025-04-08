import { Router } from "express";
import { body } from "express-validator";
import { validateEnpoint } from "../middlewares/validatorEnpoint";
import { createCompanyController, getCompaniesController, getNewCompaniesController } from "../controllers/Company.Controller";

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
        body("currentBoxUsed").isInt().notEmpty(),
        body("runCurrentBoxKitOnly").isBoolean().notEmpty(),
        body("minimunNumBox").isInt().notEmpty(),
        body("maximunNumBox").isInt().notEmpty(),
        body("orderUsed").isBoolean().notEmpty(),
        body("weightDataAvailable").isBoolean().notEmpty(),
        body("idWeightData").isInt().notEmpty(),
        body("idBoxDimension").isInt().notEmpty(),
        body("assignedBoxes").isBoolean().notEmpty(),
        body("itemClearanceRuleUsed").isBoolean().notEmpty(),
        body("clearanceAmount").isFloat().notEmpty(),
        body("multipleItemsPreCubed").isBoolean().notEmpty(),
        body("idFreightChargeMethod").isInt().notEmpty(),
        body("dimWeightFactor").isInt().notEmpty(),
        body("idPackMaterial").isInt().notEmpty(),
        body("packMaterialCost").isFloat().notEmpty(),
        body("corrugateType").isString(),
        body("corrugateCost").isFloat().notEmpty(),
        body("freightCostPerLb").isFloat().notEmpty(),
        validateEnpoint
    ],
    createCompanyController
);

/**
 * @swagger
 * /companies:
 *   get:
 *     tags:
 *       - Companies
 *     summary: Get companies with pagination
 *     description: Returns a paginated list of companies available in the system.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page (optional)
 *     responses:
 *       200:
 *         description: Successfully obtained companies
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
 *                       example: company.found
 *                     translationParams:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: getCompanies
 *                 data:
 *                   type: object
 *                   properties:
 *                     companies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           idCompany:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: company XYZ
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 10
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
companyRouter.get("/companies", getCompaniesController);

/**
 * @swagger
 * /newCompanies:
 *   get:
 *     tags:
 *       - Companies
 *     summary: Get companies with pagination
 *     description: Returns a paginated list of companies available in the system.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page (optional)
 *     responses:
 *       200:
 *         description: Successfully obtained companies
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
 *                       example: company.found
 *                     translationParams:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: getCompanies
 *                 data:
 *                   type: object
 *                   properties:
 *                     companies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           idCompany:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: company XYZ
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 10
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
companyRouter.get("/newCompanies", getNewCompaniesController);

export default companyRouter;
