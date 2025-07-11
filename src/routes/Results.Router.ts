import { Router } from "express";
import { runEvenDistributionModelController, getResultsByOrderController, runTopFrequenciesModelController, runEvenVolumeModelController, runEvenVolumeDinamicoModelController, existsResultsByOrderController, getValidateResultsByOrderController, getImprovementController, getBoxDimensionsResultController } from "../controllers/Results.Controller";

const evenDistributionModelRouter = Router();

/**
 * @swagger
 * /even-distribution-model:
 *   post:
 *     tags:
 *       - Distribution Models
 *     summary: Run Even Distribution model for a shipment order
 *     description: Executes the Even Distribution model for the specified order and stores the results.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idOrder
 *             properties:
 *               idOrder:
 *                 type: integer
 *                 example: 123
 *     responses:
 *       200:
 *         description: Even Distribution model completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: even_distribution_completed
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: missing_idOrder
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: error_server
 *                 error:
 *                   type: string
 *                   example: Some internal error message
 */
evenDistributionModelRouter.post("/even-distribution-model", runEvenDistributionModelController);

/**
 * @swagger
 * components:
 *   schemas:
 *     IResult:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         idOrder:
 *           type: integer
 *         idAttributeData:
 *           type: integer
 *         idShipmenDataFile:
 *           type: integer
 *         model:
 *           type: string
 *         boxNumber:
 *           type: integer
 *         newAssignedBoxLength:
 *           type: number
 *         newAssignedBoxWidth:
 *           type: number
 *         newAssignedBoxHeight:
 *           type: number
 *         currentBoxCorrugateArea:
 *           type: number
 *         newBoxCorrugateArea:
 *           type: number
 *         currentBoxCorrugateCost:
 *           type: number
 *         newBoxCorrugateCost:
 *           type: number
 *         currentDimWeight:
 *           type: number
 *         newDimWeight:
 *           type: number
 *         currentBillableWeight:
 *           type: number
 *         newBillableWeight:
 *           type: number
 *         currentFreightCost:
 *           type: number
 *         newFreightCost:
 *           type: number
 *         currentVoidVolume:
 *           type: number
 *         newVoidVolume:
 *           type: number
 *         currentVoidFillCost:
 *           type: number
 *         newVoidFillCost:
 *           type: number
 *         orderId:
 *           type: integer
 *         item1Length:
 *           type: number
 *         item1Width:
 *           type: number
 *         item1Height:
 *           type: number
 *         item1Weight:
 *           type: number
 *         item2Length:
 *           type: number
 *         item2Width:
 *           type: number
 *         item2Height:
 *           type: number
 *         item2Weight:
 *           type: number
 *         item3Length:
 *           type: number
 *         item3Width:
 *           type: number
 *         item3Height:
 *           type: number
 *         item3Weight:
 *           type: number
 *         item4Length:
 *           type: number
 *         item4Width:
 *           type: number
 *         item4Height:
 *           type: number
 *         item4Weight:
 *           type: number
 *         item5Length:
 *           type: number
 *         item5Width:
 *           type: number
 *         item5Height:
 *           type: number
 *         item5Weight:
 *           type: number
 *
 * /results:
 *   get:
 *     tags:
 *       - Distribution Models
 *     summary: Obtener resultados por idOrder (paginado)
 *     description: Retorna los resultados de TB_Results filtrados por idOrder y paginados, incluyendo los datos de items 1-5 de TB_ShipmentDataFile.
 *     parameters:
 *       - in: query
 *         name: idOrder
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden a consultar
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página de resultados
 *       - in: query
 *         name: pageSize
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página
 *     responses:
 *       200:
 *         description: Resultados encontrados agrupados por modelo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       model:
 *                         type: string
 *                         description: Nombre del modelo (EvenDistribution, TopFrequencies, EvenVolume, EvenVolumeDinamico)
 *                       results:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/IResult'
 *                       boxNumbers:
 *                         type: array
 *                         items:
 *                           type: integer
 *                       total:
 *                         type: integer
 *                       page:
 *                         type: integer
 *                       pageSize:
 *                         type: integer
 *                       totalPages:
 *                         type: integer
 *                       summaryCards:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             label:
 *                               type: string
 *                             value:
 *                               type: integer
 *                               nullable: true
 *                       totalBoxesUsed:
 *                         type: integer
 *                       minBoxNumber:
 *                         type: integer
 *                         nullable: true
 *                       maxBoxNumber:
 *                         type: integer
 *                         nullable: true
 *       400:
 *         description: Parámetro idOrder inválido
 *       500:
 *         description: Error interno del servidor
 */
evenDistributionModelRouter.get("/results", getResultsByOrderController);

/**
 * @swagger
 * /top-frecuencies-model:
 *   post:
 *     tags:
 *       - Distribution Models
 *     summary: Run Top Frecuencies model for a shipment order
 *     description: Executes the Top Frecuencies model for the specified order and stores the results.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idOrder
 *             properties:
 *               idOrder:
 *                 type: integer
 *                 example: 123
 *     responses:
 *       200:
 *         description: Top Frecuencies model completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: top_frecuencies_completed
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: missing_idOrder
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: error_server
 *                 error:
 *                   type: string
 *                   example: Some internal error message
 */
evenDistributionModelRouter.post("/top-frecuencies-model", runTopFrequenciesModelController);

/**
 * @swagger
 * /even-volume-model:
 *   post:
 *     tags:
 *       - Distribution Models
 *     summary: Run Even Volume model for a shipment order
 *     description: Executes the Even Volume model for the specified order and stores the results.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idOrder
 *             properties:
 *               idOrder:
 *                 type: integer
 *                 example: 123
 *     responses:
 *       200:
 *         description: Even Volume model completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: even_volume_completed
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: missing_idOrder
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: error_server
 *                 error:
 *                   type: string
 *                   example: Some internal error message
 */
evenDistributionModelRouter.post("/even-volume-model", runEvenVolumeModelController);

/**
 * @swagger
 * /even-volume-dinamico:
 *   post:
 *     tags:
 *       - Distribution Models
 *     summary: Run Even Volume Dinamico model for a shipment order
 *     description: Executes the Even Volume model for the specified order and stores the results.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idOrder
 *             properties:
 *               idOrder:
 *                 type: integer
 *                 example: 123
 *     responses:
 *       200:
 *         description: Even Volume Dinamico model completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: even_volume_dinamico_completed
 *       400:
 *         description: Missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: missing_idOrder
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: error_server
 *                 error:
 *                   type: string
 *                   example: Some internal error message
 */
evenDistributionModelRouter.post("/even-volume-dinamico", runEvenVolumeDinamicoModelController);

/**
 * @swagger
 * /results/exists:
 *   get:
 *     tags:
 *       - Results
 *     summary: Verifica si existen resultados para un idOrder
 *     description: Retorna 1 si existen resultados para el idOrder, 0 si no existen.
 *     parameters:
 *       - in: query
 *         name: idOrder
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden a consultar
 *     responses:
 *       200:
 *         description: Resultado de la existencia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: integer
 *                   enum: [0, 1]
 *                   example: 1
 *       400:
 *         description: Parámetro idOrder inválido
 *       500:
 *         description: Error interno del servidor
 */
evenDistributionModelRouter.get("/results/exists", existsResultsByOrderController);

/**
 * @swagger
 * /results/validate:
 *   get:
 *     tags:
 *       - Distribution Models
 *     summary: Valida si existen resultados para un idOrder
 *     description: Retorna 1 si existen resultados para el idOrder, 0 si no existen.
 *     parameters:
 *       - in: query
 *         name: idOrder
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden a consultar
 *     responses:
 *       200:
 *         description: Resultado de la validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: integer
 *                   enum: [0, 1]
 *                   example: 1
 *       400:
 *         description: Parámetro idOrder inválido
 *       500:
 *         description: Error interno del servidor
 */
evenDistributionModelRouter.get("/results/validate", getValidateResultsByOrderController);

/**
 * @swagger
 * /model-improvements:
 *   get:
 *     tags:
 *       - Distribution Models
 *     summary: Get optimization improvement percentages
 *     description: |
 *       Returns improvement metrics for an optimization model compared to its current version.
 *       Models supported: `EvenDistribution`, `TopFrequencies`, `EvenVolumeDynamic`, `EvenVolume`.
 *     parameters:
 *       - in: query
 *         name: idOrder
 *         schema:
 *           type: integer
 *         required: true
 *         description: Order ID to analyze.
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *           enum: [EvenDistribution, TopFrequencies, EvenVolumeDynamic, EvenVolume]
 *         required: true
 *         description: Optimization model to evaluate.
 *     responses:
 *       200:
 *         description: Improvement results per box.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   boxNumber:
 *                     type: integer
 *                   DimensionalWeightImprovement:
 *                     type: number
 *                     format: float
 *                   EstimatedTotalFreightImprovement:
 *                     type: number
 *                     format: float
 *                   VoidVolumeImprovement:
 *                     type: number
 *                     format: float
 *                   VoidFillCostImprovement:
 *                     type: number
 *                     format: float
 *                   CorrugateAreaImprovement:
 *                     type: number
 *                     format: float
 *                   CorrugateCostImprovement:
 *                     type: number
 *                     format: float
 *       400:
 *         description: Missing required parameters or invalid values.
 *       500:
 *         description: Server error.
 */
evenDistributionModelRouter.get("/model-improvements", getImprovementController);

/**
 * @swagger
 * /box-dimensions-result:
 *   get:
 *     tags:
 *       - Distribution Models
 *     summary: Get box dimensions by order and model
 *     description: Returns distinct box dimensions used in a given optimization model.
 *     parameters:
 *       - in: query
 *         name: idOrder
 *         schema:
 *           type: integer
 *         required: true
 *         description: Order ID to filter by.
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *           enum: [EvenDistribution, TopFrequencies, EvenVolumeDynamic, EvenVolume]
 *         required: true
 *         description: Model name to filter by.
 *       - in: query
 *         name: numBoxes
 *         schema:
 *           type: integer
 *         required: false
 *         description: Optional filter by number of boxes (numBoxes).
 *     responses:
 *       200:
 *         description: List of box dimensions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   boxLabel:
 *                     type: string
 *                   boxLength:
 *                     type: number
 *                     format: float
 *                   boxWidth:
 *                     type: number
 *                     format: float
 *                   boxHeight:
 *                     type: number
 *                     format: float
 *       400:
 *         description: Missing required parameters.
 *       500:
 *         description: Server error.
 */
evenDistributionModelRouter.get("/box-dimensions-result", getBoxDimensionsResultController);

export default evenDistributionModelRouter;
