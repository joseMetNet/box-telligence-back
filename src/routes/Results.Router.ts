import { Router } from "express";
import { runEvenDistributionModelController } from "../controllers/Results.Controller";

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

export default evenDistributionModelRouter;
