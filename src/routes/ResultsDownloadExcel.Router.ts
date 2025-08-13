import { Router } from 'express';
import { downloadExcelResultsByOrder, downloadExcelResultsPercentajeByOrder } from '../repository/ResultsDownloadExcel.Repository';
import { downloadSumaryDataFromResultsController } from '../controllers/Results.Controller';

const resultsDownloadExcelRouter = Router();

/**
 * @swagger
 * /results/download-excel:
 *   get:
 *     summary: Descarga un Excel con los resultados de todos los modelos y sus modelos Current para un idOrder.
 *     tags:
 *       - Results
 *     parameters:
 *       - in: query
 *         name: idOrder
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden a consultar
 *     responses:
 *       200:
 *         description: Archivo Excel generado correctamente.
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: idOrder es requerido.
 *       500:
 *         description: Error generando el Excel.
 */
resultsDownloadExcelRouter.get('/results/download-excel', async (req, res) => {
    const idOrder = Number(req.query.idOrder);
    if (!idOrder) return res.status(400).json({ message: 'idOrder is required' });
    try {
        await downloadExcelResultsByOrder(idOrder, res);
    } catch (err) {
        res.status(500).json({ message: 'Error generating Excel', error: err });
    }
});


/**
 * @swagger
 * /results/download-excel-percentaje:
 *   get:
 *     summary: Descarga un Excel con los porcentajes de mejora entre modelo optimizado y actual para un idOrder y modelo.
 *     tags:
 *       - Results
 *     parameters:
 *       - in: query
 *         name: idOrder
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *     responses:
 *       200:
 *         description: Archivo Excel generado correctamente.
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: idOrder y model son requeridos.
 *       500:
 *         description: Error generando el Excel.
 */
resultsDownloadExcelRouter.get('/results/download-excel-percentaje', async (req, res) => {
  const idOrder = Number(req.query.idOrder);
  if (!idOrder) {
    return res.status(400).json({ message: 'idOrder is required' });
  }
  try {
    await downloadExcelResultsPercentajeByOrder(idOrder, res);
  } catch (err) {
    res.status(500).json({ message: 'Error generating Excel', error: err });
  }
});

//en caso de que se quiera implementar una ruta para descargar el Excel de porcentajes por modelo optimizado agregar el modelo como parámetro
//  *         description: ID de la orden
//  *       - in: query
//  *         name: model
//  *         required: true
//  *         schema:
//  *           type: string
//  *           enum: [EvenDistribution, TopFrequencies, EvenVolumeDynamic, EvenVolume]
//  *         description: Modelo optimizado a comparar
//  *     responses:
// resultsDownloadExcelRouter.get('/results/download-excel-percentaje', async (req, res) => {
//     const idOrder = Number(req.query.idOrder);
//     const model = req.query.model as "EvenDistribution" | "TopFrequencies" | "EvenVolumeDynamic" | "EvenVolume";
//     if (!idOrder || !model) {
//         return res.status(400).json({ message: 'idOrder and model are required' });
//     }
//     try {
//         await downloadExcelResultsPercentajeByOrder(idOrder, model, res);
//     } catch (err) {
//         res.status(500).json({ message: 'Error generating Excel', error: err });
//     }
// });

/**
 * @swagger
 * /excel/sumary-data/{idOrder}:
 *   get:
 *     tags:
 *       - Results
 *     summary: Descargar Summary Data (estructura de getResultsByOrder)
 *     description: Genera y descarga un Excel con las hojas <Model>_Results, Current<Model>_Results (si existe) y <Model>_Summary, usando la misma agregación de getResultsByOrder.
 *     parameters:
 *       - in: path
 *         name: idOrder
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la orden
 *         example: 123
 *     responses:
 *       200:
 *         description: Archivo Excel generado correctamente.
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetros inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   example:
 *                     translationKey: excel.required_field_text
 *                     translationParams: { name: "idOrder" }
 *       404:
 *         description: No hay datos para el idOrder indicado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No hay datos para este idOrder.
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   example:
 *                     translationKey: error_server
 *                     translationParams: { name: "downloadSumaryDataFromResultsController" }
 */
resultsDownloadExcelRouter.get("/excel/sumary-data/:idOrder", downloadSumaryDataFromResultsController);


export default resultsDownloadExcelRouter;