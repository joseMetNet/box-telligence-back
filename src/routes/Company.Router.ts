import { Router } from "express";
import { body } from "express-validator";
import { validateEnpoint } from "../middlewares/validatorEnpoint";
import { createCompanyController, deleteFileCompanyController, getCompaniesController, getCompanyByIdController, getCompanyFileDetailsByDate, getDataFilesCompaniesByIdController, getNewCompaniesController, getOlderCompaniesController } from "../controllers/Company.Controller";

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

/**
 * @swagger
 * /olderCompanies:
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
companyRouter.get("/olderCompanies", getOlderCompaniesController);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     tags:
 *       - Companies
 *     summary: Get a company by ID
 *     description: Returns a single company based on the provided ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company to retrieve
 *     responses:
 *       200:
 *         description: Successfully found company
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
 *                     translationParams:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                     translationParams:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *       400:
 *         description: Bad request or server error
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
 *                     translationParams:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 */
companyRouter.get("/companies/:id", getCompanyByIdController);

/**
 * @swagger
 * /fileDataCompanies/{id}:
 *   get:
 *     tags:
 *       - Companies
 *     summary: Get a files data company by ID
 *     description: Returns a data loaded of company based on the provided ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the company to retrieve
 *     responses:
 *       200:
 *         description: Successfully found company
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
 *                     translationParams:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                     translationParams:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *       400:
 *         description: Bad request or server error
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
 *                     translationParams:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 */
companyRouter.get("/fileDataCompanies/:id", getDataFilesCompaniesByIdController);


/**
 * @swagger
 * /file-details:
 *   get:
 *     tags:
 *       - Companies
 *     summary: Get file details by type and date with pagination
 *     description: Returns details for a specific company file with optional pagination.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fileType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Box Kit File, Shipment Data File]
 *       - in: query
 *         name: uploadDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: File details with pagination
 *       204:
 *         description: No data found
 *       400:
 *         description: Bad request or invalid file type
 *       500:
 *         description: Internal server error
 */
companyRouter.get("/file-details", getCompanyFileDetailsByDate);

/**
 * @swagger
 * /file-company/{id}:
 *   delete:
 *     tags:
 *       - Companies
 *     summary: Delete all files and related data for an order
 *     description: Deletes every record associated with the given order (results, kit boxes, box kit file, shipment data file, and name file) using the idOrder.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID (idOrder) whose related data will be deleted
 *     responses:
 *       200:
 *         description: Data successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: company.successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedResults:
 *                       type: integer
 *                     deletedKitBoxes:
 *                       type: integer
 *                     deletedBoxKitFile:
 *                       type: integer
 *                     deletedShipmentDataFile:
 *                       type: integer
 *                     deletedNameFile:
 *                       type: integer
 *                     totalDeleted:
 *                       type: integer
 *       404:
 *         description: No records found for the given idOrder
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID supplied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
companyRouter.delete("/file-company/:id", deleteFileCompanyController);

export default companyRouter;
