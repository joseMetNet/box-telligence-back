import * as ExcelJS from 'exceljs';
import { IresponseRepositoryService, ShipmentRow } from '../interface/ShipmentDataFile.Interface';
import { connectToSqlServer } from '../DB/config';
import sql from 'mssql';
import { applyAABBHeuristic } from './Results.repository';

export const generateExcelTemplateShipmentDataFile = async (): Promise<IresponseRepositoryService> => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ShipmentDataFile');

        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 15 },
            { header: 'Item 1 Length', key: 'item1Length', width: 15 },
            { header: 'Item 1 Width', key: 'item1Width', width: 15 },
            { header: 'Item 1 Height', key: 'item1Height', width: 15 },
            { header: 'Item 1 Weight', key: 'item1Weight', width: 15 },
            { header: 'Item 2 Length', key: 'item2Length', width: 15 },
            { header: 'Item 2 Width', key: 'item2Width', width: 15 },
            { header: 'Item 2 Height', key: 'item2Height', width: 15 },
            { header: 'Item 2 Weight', key: 'item2Weight', width: 15 },
            { header: 'Item 3 Length', key: 'item3Length', width: 15 },
            { header: 'Item 3 Width', key: 'item3Width', width: 15 },
            { header: 'Item 3 Height', key: 'item3Height', width: 15 },
            { header: 'Item 3 Weight', key: 'item3Weight', width: 15 },
            { header: 'Item 4 Length', key: 'item4Length', width: 15 },
            { header: 'Item 4 Width', key: 'item4Width', width: 15 },
            { header: 'Item 4 Height', key: 'item4Height', width: 15 },
            { header: 'Item 4 Weight', key: 'item4Weight', width: 15 },
            { header: 'Item 5 Length', key: 'item5Length', width: 15 },
            { header: 'Item 5 Width', key: 'item5Width', width: 15 },
            { header: 'Item 5 Height', key: 'item5Height', width: 15 },
            { header: 'Item 5 Weight', key: 'item5Weight', width: 15 },
            { header: 'Cubed Item Length', key: 'cubedItemLength', width: 18 },
            { header: 'Cubed Item Width', key: 'cubedItemWidth', width: 18 },
            { header: 'Cubed Item Height', key: 'cubedItemHeight', width: 18 },
            { header: 'Cubed Item Weight', key: 'cubedItemWeight', width: 18 },
            { header: 'Current Assigned Box Length', key: 'currentAssignedBoxLength', width: 30 },
            { header: 'Current Assigned Box Width', key: 'currentAssignedBoxWidth', width: 30 },
            { header: 'Current Assigned Box Height', key: 'currentAssignedBoxHeight', width: 30 }
        ];

        const buffer = await workbook.xlsx.writeBuffer();

        return {
            code: 200,
            message: { translationKey: 'excel.template_generated', translationParams: { name: "generateExcelTemplateShipmentDataFile" } },
            data: buffer
        };
    } catch (err) {
        console.error('Error generating Excel template:', err);
        return {
            code: 500,
            message: { translationKey: 'excel.error_server', translationParams: { name: "generateExcelTemplateShipmentDataFile" } }
        };
    }
};


// export const uploadExcelShipmentDataFile = async (
//   fileBuffer: Buffer,
//   idCompany: number,
//   fileName: string
// ): Promise<IresponseRepositoryService> => {
//   try {
//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.load(fileBuffer);

//     const worksheet = workbook.getWorksheet('ShipmentDataFile') || workbook.worksheets[0];
//     if (!worksheet) {
//       return {
//         code: 400,
//         message: {
//           translationKey: 'excel.templateFileNotFound',
//           translationParams: { name: 'uploadExcelBoxKitFile' }
//         }
//       };
//     }

//     const db = await connectToSqlServer();
//     const transaction = new sql.Transaction(db);
//     await transaction.begin();

//     const getOrderRequest = new sql.Request(transaction);
//     getOrderRequest.input('idCompany', sql.Int, idCompany);
//     const orderResult = await getOrderRequest.query(`
//       SELECT TOP 1 id FROM TB_Order WHERE idCompany = @idCompany ORDER BY createAt DESC;
//     `);

//     if (orderResult.recordset.length === 0) {
//       await transaction.rollback();
//       return {
//         code: 404,
//         message: {
//           translationKey: 'order.notFound',
//           translationParams: { idCompany }
//         }
//       };
//     }

//     const idOrder = orderResult.recordset[0].id;

//     const updateStatusRequest = new sql.Request(transaction);
//     updateStatusRequest.input('idOrder', sql.Int, idOrder);
//     updateStatusRequest.input('idStatusData', sql.Int, 3);
//     await updateStatusRequest.query(`
//       UPDATE TB_Order SET idStatusData = @idStatusData WHERE id = @idOrder;
//     `);

//     const insertNameFileRequest = new sql.Request(transaction);
//     insertNameFileRequest.input('fileName', sql.VarChar(255), fileName);
//     insertNameFileRequest.input('fileType', sql.VarChar(100), 'ShipmentDataFile');
//     insertNameFileRequest.input('idOrder', sql.Int, idOrder);
//     await insertNameFileRequest.query(`
//       INSERT INTO TB_NameFile (fileName, fileType, uploadedAt, idOrder)
//       VALUES (@fileName, @fileType, GETDATE(), @idOrder);
//     `);

//     const insertQuery = `
//       INSERT INTO TB_ShipmentDataFile (
//         orderId, item1Length, item1Width, item1Height, item1Weight,
//         item2Length, item2Width, item2Height, item2Weight,
//         item3Length, item3Width, item3Height, item3Weight,
//         item4Length, item4Width, item4Height, item4Weight,
//         item5Length, item5Width, item5Height, item5Weight,
//         cubedItemLength, cubedItemWidth, cubedItemHeight, cubedItemWeight,
//         currentAssignedBoxLength, currentAssignedBoxWidth, currentAssignedBoxHeight, idOrder, createAt
//       )
//       VALUES (
//         @orderId, @item1Length, @item1Width, @item1Height, @item1Weight,
//         @item2Length, @item2Width, @item2Height, @item2Weight,
//         @item3Length, @item3Width, @item3Height, @item3Weight,
//         @item4Length, @item4Width, @item4Height, @item4Weight,
//         @item5Length, @item5Width, @item5Height, @item5Weight,
//         @cubedItemLength, @cubedItemWidth, @cubedItemHeight, @cubedItemWeight,
//         @currentAssignedBoxLength, @currentAssignedBoxWidth, @currentAssignedBoxHeight, @idOrder, GETDATE()
//       );
//     `;

//     const rowsToInsert = extractRowsFromWorksheet(worksheet);
//     if (rowsToInsert.length === 0) {
//       await transaction.rollback();
//       return {
//         code: 400,
//         message: {
//           translationKey: 'excel.noValidRows',
//           translationParams: {}
//         }
//       };
//     }

//     let insertedRows = 0;

//     for (const row of rowsToInsert) {
//       try {
//         const request = new sql.Request(transaction);
//         request.input('orderId', sql.Int, idOrder);
//         request.input('item1Length', sql.Decimal(10, 2), parseDecimalValue(row.item1Length));
//         request.input('item1Width', sql.Decimal(10, 2), parseDecimalValue(row.item1Width));
//         request.input('item1Height', sql.Decimal(10, 2), parseDecimalValue(row.item1Height));
//         request.input('item1Weight', sql.Decimal(10, 2), parseDecimalValue(row.item1Weight));
//         request.input('item2Length', sql.Decimal(10, 2), parseDecimalValue(row.item2Length));
//         request.input('item2Width', sql.Decimal(10, 2), parseDecimalValue(row.item2Width));
//         request.input('item2Height', sql.Decimal(10, 2), parseDecimalValue(row.item2Height));
//         request.input('item2Weight', sql.Decimal(10, 2), parseDecimalValue(row.item2Weight));
//         request.input('item3Length', sql.Decimal(10, 2), parseDecimalValue(row.item3Length));
//         request.input('item3Width', sql.Decimal(10, 2), parseDecimalValue(row.item3Width));
//         request.input('item3Height', sql.Decimal(10, 2), parseDecimalValue(row.item3Height));
//         request.input('item3Weight', sql.Decimal(10, 2), parseDecimalValue(row.item3Weight));
//         request.input('item4Length', sql.Decimal(10, 2), parseDecimalValue(row.item4Length));
//         request.input('item4Width', sql.Decimal(10, 2), parseDecimalValue(row.item4Width));
//         request.input('item4Height', sql.Decimal(10, 2), parseDecimalValue(row.item4Height));
//         request.input('item4Weight', sql.Decimal(10, 2), parseDecimalValue(row.item4Weight));
//         request.input('item5Length', sql.Decimal(10, 2), parseDecimalValue(row.item5Length));
//         request.input('item5Width', sql.Decimal(10, 2), parseDecimalValue(row.item5Width));
//         request.input('item5Height', sql.Decimal(10, 2), parseDecimalValue(row.item5Height));
//         request.input('item5Weight', sql.Decimal(10, 2), parseDecimalValue(row.item5Weight));
//         request.input('cubedItemLength', sql.Decimal(10, 2), parseDecimalValue(row.cubedItemLength));
//         request.input('cubedItemWidth', sql.Decimal(10, 2), parseDecimalValue(row.cubedItemWidth));
//         request.input('cubedItemHeight', sql.Decimal(10, 2), parseDecimalValue(row.cubedItemHeight));
//         request.input('cubedItemWeight', sql.Decimal(10, 2), parseDecimalValue(row.cubedItemWeight));
//         request.input('currentAssignedBoxLength', sql.Decimal(10, 2), parseDecimalValue(row.currentAssignedBoxLength));
//         request.input('currentAssignedBoxWidth', sql.Decimal(10, 2), parseDecimalValue(row.currentAssignedBoxWidth));
//         request.input('currentAssignedBoxHeight', sql.Decimal(10, 2), parseDecimalValue(row.currentAssignedBoxHeight));
//         request.input('idOrder', sql.Int, idOrder);

//         await request.query(insertQuery);
//         insertedRows++;
//       } catch (error) {
//         console.error(`Error inserting row for orderId ${idOrder}`, error);
//       }
//     }

//     if (insertedRows > 0) {
//       await transaction.commit();
//       return {
//         code: 200,
//         message: {
//           translationKey: 'excel.template_generated',
//           translationParams: { name: 'uploadExcelBoxKitFile' }
//         }
//       };
//     } else {
//       await transaction.rollback();
//       return {
//         code: 400,
//         message: {
//           translationKey: 'excel.noRowsInserted',
//           translationParams: { name: 'uploadExcelBoxKitFile' }
//         }
//       };
//     }

//   } catch (err) {
//     console.error('server error:', err);
//     return {
//       code: 500,
//       message: {
//         translationKey: 'excel.error_server',
//         translationParams: { name: 'uploadExcelBoxKitFile' }
//       }
//     };
//   }
// };

// export const uploadExcelShipmentDataFile = async (
//   fileBuffer: Buffer,
//   idCompany: number,
//   fileName: string
// ): Promise<IresponseRepositoryService> => {
//   try {
//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.load(fileBuffer);

//     const worksheet = workbook.getWorksheet('ShipmentDataFile') || workbook.worksheets[0];
//     if (!worksheet) {
//       return {
//         code: 400,
//         message: {
//           translationKey: 'excel.templateFileNotFound',
//           translationParams: { name: 'uploadExcelBoxKitFile' }
//         }
//       };
//     }

//     const db = await connectToSqlServer();
//     const transaction = new sql.Transaction(db);
//     await transaction.begin();

//     const getOrderRequest = new sql.Request(transaction);
//     getOrderRequest.input('idCompany', sql.Int, idCompany);
//     const orderResult = await getOrderRequest.query(`
//       SELECT TOP 1 id FROM TB_Order WHERE idCompany = @idCompany ORDER BY createAt DESC;
//     `);

//     if (orderResult.recordset.length === 0) {
//       await transaction.rollback();
//       return {
//         code: 404,
//         message: {
//           translationKey: 'order.notFound',
//           translationParams: { idCompany }
//         }
//       };
//     }

//     const idOrder = orderResult.recordset[0].id;

//     // Cambiar estado de la orden
//     await new sql.Request(transaction)
//       .input('idOrder', sql.Int, idOrder)
//       .input('idStatusData', sql.Int, 3)
//       .query(`UPDATE TB_Order SET idStatusData = @idStatusData WHERE id = @idOrder;`);

//     // Registrar archivo
//     await new sql.Request(transaction)
//       .input('fileName', sql.VarChar(255), fileName)
//       .input('fileType', sql.VarChar(100), 'ShipmentDataFile')
//       .input('idOrder', sql.Int, idOrder)
//       .query(`INSERT INTO TB_NameFile (fileName, fileType, uploadedAt, idOrder)
//               VALUES (@fileName, @fileType, GETDATE(), @idOrder);`);

//     // Obtener las cajas del BoxKit
//     const boxKitQuery = await new sql.Request(transaction)
//       .input('idOrder', sql.Int, idOrder)
//       .query(`SELECT * FROM TB_BoxKitFile WHERE idOrder = @idOrder ORDER BY length ASC`);
//     const boxKit = boxKitQuery.recordset;

//     const insertQuery = `
//       INSERT INTO TB_ShipmentDataFile (
//         orderId, item1Length, item1Width, item1Height, item1Weight,
//         item2Length, item2Width, item2Height, item2Weight,
//         item3Length, item3Width, item3Height, item3Weight,
//         item4Length, item4Width, item4Height, item4Weight,
//         item5Length, item5Width, item5Height, item5Weight,
//         cubedItemLength, cubedItemWidth, cubedItemHeight, cubedItemWeight,
//         currentAssignedBoxLength, currentAssignedBoxWidth, currentAssignedBoxHeight, idOrder, createAt
//       ) VALUES (
//         @orderId, @item1Length, @item1Width, @item1Height, @item1Weight,
//         @item2Length, @item2Width, @item2Height, @item2Weight,
//         @item3Length, @item3Width, @item3Height, @item3Weight,
//         @item4Length, @item4Width, @item4Height, @item4Weight,
//         @item5Length, @item5Width, @item5Height, @item5Weight,
//         @cubedItemLength, @cubedItemWidth, @cubedItemHeight, @cubedItemWeight,
//         @currentAssignedBoxLength, @currentAssignedBoxWidth, @currentAssignedBoxHeight, @idOrder, GETDATE()
//       );
//     `;

//     const rowsToInsert = extractRowsFromWorksheet(worksheet);
//     if (rowsToInsert.length === 0) {
//       await transaction.rollback();
//       return {
//         code: 400,
//         message: {
//           translationKey: 'excel.noValidRows',
//           translationParams: {}
//         }
//       };
//     }

//     let insertedRows = 0;

//     for (const row of rowsToInsert) {
//       try {
//         const request = new sql.Request(transaction);

//         const itemLength: any = parseDecimalValue(row.cubedItemLength);
//         const itemWidth: any = parseDecimalValue(row.cubedItemWidth);
//         const itemHeight: any = parseDecimalValue(row.cubedItemHeight);

//         let currentLength = parseDecimalValue(row.currentAssignedBoxLength);
//         let currentWidth = parseDecimalValue(row.currentAssignedBoxWidth);
//         let currentHeight = parseDecimalValue(row.currentAssignedBoxHeight);

//         const needsAssignment =
//           !currentLength || currentLength === 0 ||
//           !currentWidth || currentWidth === 0 ||
//           !currentHeight || currentHeight === 0;

//         if (needsAssignment && boxKit.length > 0) {
//           const box = boxKit.find(box =>
//             box.length >= itemLength &&
//             box.width >= itemWidth &&
//             box.height >= itemHeight
//           );

//           if (box) {
//             currentLength = box.length;
//             currentWidth = box.width;
//             currentHeight = box.height;
//           } else {
//             const fallback = boxKit[boxKit.length - 1];
//             currentLength = fallback.length;
//             currentWidth = fallback.width;
//             currentHeight = fallback.height;
//           }
//         }

//         request.input('orderId', sql.Decimal(10, 2), parseDecimalValue(row.orderId));
//         request.input('item1Length', sql.Decimal(10, 2), parseDecimalValue(row.item1Length));
//         request.input('item1Width', sql.Decimal(10, 2), parseDecimalValue(row.item1Width));
//         request.input('item1Height', sql.Decimal(10, 2), parseDecimalValue(row.item1Height));
//         request.input('item1Weight', sql.Decimal(10, 2), parseDecimalValue(row.item1Weight));
//         request.input('item2Length', sql.Decimal(10, 2), parseDecimalValue(row.item2Length));
//         request.input('item2Width', sql.Decimal(10, 2), parseDecimalValue(row.item2Width));
//         request.input('item2Height', sql.Decimal(10, 2), parseDecimalValue(row.item2Height));
//         request.input('item2Weight', sql.Decimal(10, 2), parseDecimalValue(row.item2Weight));
//         request.input('item3Length', sql.Decimal(10, 2), parseDecimalValue(row.item3Length));
//         request.input('item3Width', sql.Decimal(10, 2), parseDecimalValue(row.item3Width));
//         request.input('item3Height', sql.Decimal(10, 2), parseDecimalValue(row.item3Height));
//         request.input('item3Weight', sql.Decimal(10, 2), parseDecimalValue(row.item3Weight));
//         request.input('item4Length', sql.Decimal(10, 2), parseDecimalValue(row.item4Length));
//         request.input('item4Width', sql.Decimal(10, 2), parseDecimalValue(row.item4Width));
//         request.input('item4Height', sql.Decimal(10, 2), parseDecimalValue(row.item4Height));
//         request.input('item4Weight', sql.Decimal(10, 2), parseDecimalValue(row.item4Weight));
//         request.input('item5Length', sql.Decimal(10, 2), parseDecimalValue(row.item5Length));
//         request.input('item5Width', sql.Decimal(10, 2), parseDecimalValue(row.item5Width));
//         request.input('item5Height', sql.Decimal(10, 2), parseDecimalValue(row.item5Height));
//         request.input('item5Weight', sql.Decimal(10, 2), parseDecimalValue(row.item5Weight));
//         request.input('cubedItemLength', sql.Decimal(10, 2), itemLength);
//         request.input('cubedItemWidth', sql.Decimal(10, 2), itemWidth);
//         request.input('cubedItemHeight', sql.Decimal(10, 2), itemHeight);
//         request.input('cubedItemWeight', sql.Decimal(10, 2), parseDecimalValue(row.cubedItemWeight));
//         request.input('currentAssignedBoxLength', sql.Decimal(10, 2), currentLength);
//         request.input('currentAssignedBoxWidth', sql.Decimal(10, 2), currentWidth);
//         request.input('currentAssignedBoxHeight', sql.Decimal(10, 2), currentHeight);
//         request.input('idOrder', sql.Int, idOrder);

//         await request.query(insertQuery);
//         insertedRows++;
//       } catch (error) {
//         console.error(`Error inserting row for orderId ${idOrder}`, error);
//       }
//     }

//     if (insertedRows > 0) {
//       await transaction.commit();
//       return {
//         code: 200,
//         message: {
//           translationKey: 'excel.template_generated',
//           translationParams: { name: 'uploadExcelBoxKitFile' }
//         }
//       };
//     } else {
//       await transaction.rollback();
//       return {
//         code: 400,
//         message: {
//           translationKey: 'excel.noRowsInserted',
//           translationParams: { name: 'uploadExcelBoxKitFile' }
//         }
//       };
//     }

//   } catch (err) {
//     console.error('server error:', err);
//     return {
//       code: 500,
//       message: {
//         translationKey: 'excel.error_server',
//         translationParams: { name: 'uploadExcelBoxKitFile' }
//       }
//     };
//   }
// };

const extractRowsFromWorksheet = (worksheet: ExcelJS.Worksheet) => {
    const rows = [];
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        const getValue = (cell: ExcelJS.Cell) => {
            const value = cell?.value;
            return value !== undefined && value !== null && value !== '' ? Number(value) : null;
        };

        const rowData = {
            orderId: Number(row.getCell(1).value),
            item1Length: getValue(row.getCell(2)),
            item1Width: getValue(row.getCell(3)),
            item1Height: getValue(row.getCell(4)),
            item1Weight: getValue(row.getCell(5)),
            item2Length: getValue(row.getCell(6)),
            item2Width: getValue(row.getCell(7)),
            item2Height: getValue(row.getCell(8)),
            item2Weight: getValue(row.getCell(9)),
            item3Length: getValue(row.getCell(10)),
            item3Width: getValue(row.getCell(11)),
            item3Height: getValue(row.getCell(12)),
            item3Weight: getValue(row.getCell(13)),
            item4Length: getValue(row.getCell(14)),
            item4Width: getValue(row.getCell(15)),
            item4Height: getValue(row.getCell(16)),
            item4Weight: getValue(row.getCell(17)),
            item5Length: getValue(row.getCell(18)),
            item5Width: getValue(row.getCell(19)),
            item5Height: getValue(row.getCell(20)),
            item5Weight: getValue(row.getCell(21)),
            cubedItemLength: getValue(row.getCell(22)),
            cubedItemWidth: getValue(row.getCell(23)),
            cubedItemHeight: getValue(row.getCell(24)),
            cubedItemWeight: getValue(row.getCell(25)),
            currentAssignedBoxLength: getValue(row.getCell(26)),
            currentAssignedBoxWidth: getValue(row.getCell(27)),
            currentAssignedBoxHeight: getValue(row.getCell(28)),
        };

        if (!isNaN(rowData.orderId)) {
            rows.push(rowData);
        } else {
            console.warn(`Row ${rowNumber} omitted due to invalid orderId.`);
        }
    }
    return rows;
};

// export const uploadExcelShipmentDataFile = async (
//   fileBuffer: Buffer,
//   idCompany: number,
//   fileName: string
// ): Promise<IresponseRepositoryService> => {
//   try {
//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.load(fileBuffer);

//     const worksheet = workbook.getWorksheet('ShipmentDataFile') || workbook.worksheets[0];
//     if (!worksheet) {
//       return {
//         code: 400,
//         message: {
//           translationKey: 'excel.templateFileNotFound',
//           translationParams: { name: 'uploadExcelBoxKitFile' }
//         }
//       };
//     }

//     const db = await connectToSqlServer();
//     const transaction = new sql.Transaction(db);
//     await transaction.begin();

//     const getOrderRequest = new sql.Request(transaction);
//     getOrderRequest.input('idCompany', sql.Int, idCompany);
//     const orderResult = await getOrderRequest.query(`
//       SELECT TOP 1 id FROM TB_Order WHERE idCompany = @idCompany ORDER BY createAt DESC;
//     `);

//     if (orderResult.recordset.length === 0) {
//       await transaction.rollback();
//       return {
//         code: 404,
//         message: {
//           translationKey: 'order.notFound',
//           translationParams: { idCompany }
//         }
//       };
//     }

//     const idOrder = orderResult.recordset[0].id;

//     await new sql.Request(transaction)
//       .input('idOrder', sql.Int, idOrder)
//       .input('idStatusData', sql.Int, 3)
//       .query(`UPDATE TB_Order SET idStatusData = @idStatusData WHERE id = @idOrder;`);

//     await new sql.Request(transaction)
//       .input('fileName', sql.VarChar(255), fileName)
//       .input('fileType', sql.VarChar(100), 'ShipmentDataFile')
//       .input('idOrder', sql.Int, idOrder)
//       .query(`INSERT INTO TB_NameFile (fileName, fileType, uploadedAt, idOrder)
//               VALUES (@fileName, @fileType, GETDATE(), @idOrder);`);

//     const boxKitQuery = await new sql.Request(transaction)
//       .input('idOrder', sql.Int, idOrder)
//       .query(`SELECT * FROM TB_BoxKitFile WHERE idOrder = @idOrder ORDER BY length ASC`);
//     const boxKit = boxKitQuery.recordset;

//     const insertQuery = `
//       INSERT INTO TB_ShipmentDataFile (
//         orderId, item1Length, item1Width, item1Height, item1Weight,
//         item2Length, item2Width, item2Height, item2Weight,
//         item3Length, item3Width, item3Height, item3Weight,
//         item4Length, item4Width, item4Height, item4Weight,
//         item5Length, item5Width, item5Height, item5Weight,
//         cubedItemLength, cubedItemWidth, cubedItemHeight, cubedItemWeight,
//         currentAssignedBoxLength, currentAssignedBoxWidth, currentAssignedBoxHeight, idOrder, createAt
//       ) VALUES (
//         @orderId, @item1Length, @item1Width, @item1Height, @item1Weight,
//         @item2Length, @item2Width, @item2Height, @item2Weight,
//         @item3Length, @item3Width, @item3Height, @item3Weight,
//         @item4Length, @item4Width, @item4Height, @item4Weight,
//         @item5Length, @item5Width, @item5Height, @item5Weight,
//         @cubedItemLength, @cubedItemWidth, @cubedItemHeight, @cubedItemWeight,
//         @currentAssignedBoxLength, @currentAssignedBoxWidth, @currentAssignedBoxHeight, @idOrder, GETDATE()
//       );
//     `;

//     const rowsToInsert = extractRowsFromWorksheet(worksheet);
//     if (rowsToInsert.length === 0) {
//       await transaction.rollback();
//       return {
//         code: 400,
//         message: {
//           translationKey: 'excel.noValidRows',
//           translationParams: {}
//         }
//       };
//     }

//     let insertedRows = 0;

//     for (const row of rowsToInsert) {
//       try {
//         const request = new sql.Request(transaction);

//         let itemLength: any = parseDecimalValue(row.cubedItemLength);
//         let itemWidth: any = parseDecimalValue(row.cubedItemWidth);
//         let itemHeight: any = parseDecimalValue(row.cubedItemHeight);
//         let itemWeight: any = parseDecimalValue(row.cubedItemWeight);

//         const isMissingCubedDimensions =
//           !itemLength || itemLength === 0 ||
//           !itemWidth || itemWidth === 0 ||
//           !itemHeight || itemHeight === 0 ||
//           !itemWeight || itemWeight === 0;

//         if (isMissingCubedDimensions) {
//           const result = applyAABBHeuristic(row);
//           if (result.length > 0) {
//             itemLength = result[0].cubedItemLength;
//             itemWidth = result[0].cubedItemWidth;
//             itemHeight = result[0].cubedItemHeight;
//             itemWeight = result[0].cubedItemWeight;
//           }
//         }

//         let currentLength = parseDecimalValue(row.currentAssignedBoxLength);
//         let currentWidth = parseDecimalValue(row.currentAssignedBoxWidth);
//         let currentHeight = parseDecimalValue(row.currentAssignedBoxHeight);

//         const needsAssignment =
//           !currentLength || currentLength === 0 ||
//           !currentWidth || currentWidth === 0 ||
//           !currentHeight || currentHeight === 0;

//         if (needsAssignment && boxKit.length > 0) {
//           const box = boxKit.find(box =>
//             box.length >= itemLength &&
//             box.width >= itemWidth &&
//             box.height >= itemHeight
//           );

//           if (box) {
//             currentLength = box.length;
//             currentWidth = box.width;
//             currentHeight = box.height;
//           } else {
//             const fallback = boxKit[boxKit.length - 1];
//             currentLength = fallback.length;
//             currentWidth = fallback.width;
//             currentHeight = fallback.height;
//           }
//         }

//         request.input('orderId', sql.Decimal(10, 2), parseDecimalValue(row.orderId));
//         request.input('item1Length', sql.Decimal(10, 2), parseDecimalValue(row.item1Length));
//         request.input('item1Width', sql.Decimal(10, 2), parseDecimalValue(row.item1Width));
//         request.input('item1Height', sql.Decimal(10, 2), parseDecimalValue(row.item1Height));
//         request.input('item1Weight', sql.Decimal(10, 2), parseDecimalValue(row.item1Weight));
//         request.input('item2Length', sql.Decimal(10, 2), parseDecimalValue(row.item2Length));
//         request.input('item2Width', sql.Decimal(10, 2), parseDecimalValue(row.item2Width));
//         request.input('item2Height', sql.Decimal(10, 2), parseDecimalValue(row.item2Height));
//         request.input('item2Weight', sql.Decimal(10, 2), parseDecimalValue(row.item2Weight));
//         request.input('item3Length', sql.Decimal(10, 2), parseDecimalValue(row.item3Length));
//         request.input('item3Width', sql.Decimal(10, 2), parseDecimalValue(row.item3Width));
//         request.input('item3Height', sql.Decimal(10, 2), parseDecimalValue(row.item3Height));
//         request.input('item3Weight', sql.Decimal(10, 2), parseDecimalValue(row.item3Weight));
//         request.input('item4Length', sql.Decimal(10, 2), parseDecimalValue(row.item4Length));
//         request.input('item4Width', sql.Decimal(10, 2), parseDecimalValue(row.item4Width));
//         request.input('item4Height', sql.Decimal(10, 2), parseDecimalValue(row.item4Height));
//         request.input('item4Weight', sql.Decimal(10, 2), parseDecimalValue(row.item4Weight));
//         request.input('item5Length', sql.Decimal(10, 2), parseDecimalValue(row.item5Length));
//         request.input('item5Width', sql.Decimal(10, 2), parseDecimalValue(row.item5Width));
//         request.input('item5Height', sql.Decimal(10, 2), parseDecimalValue(row.item5Height));
//         request.input('item5Weight', sql.Decimal(10, 2), parseDecimalValue(row.item5Weight));
//         request.input('cubedItemLength', sql.Decimal(10, 2), itemLength);
//         request.input('cubedItemWidth', sql.Decimal(10, 2), itemWidth);
//         request.input('cubedItemHeight', sql.Decimal(10, 2), itemHeight);
//         request.input('cubedItemWeight', sql.Decimal(10, 2), itemWeight);
//         request.input('currentAssignedBoxLength', sql.Decimal(10, 2), currentLength);
//         request.input('currentAssignedBoxWidth', sql.Decimal(10, 2), currentWidth);
//         request.input('currentAssignedBoxHeight', sql.Decimal(10, 2), currentHeight);
//         request.input('idOrder', sql.Int, idOrder);

//         await request.query(insertQuery);
//         insertedRows++;
//       } catch (error) {
//         console.error(`Error inserting row for orderId ${idOrder}`, error);
//       }
//     }

//     if (insertedRows > 0) {
//       await transaction.commit();
//       return {
//         code: 200,
//         message: {
//           translationKey: 'excel.template_generated',
//           translationParams: { name: 'uploadExcelBoxKitFile' }
//         }
//       };
//     } else {
//       await transaction.rollback();
//       return {
//         code: 400,
//         message: {
//           translationKey: 'excel.noRowsInserted',
//           translationParams: { name: 'uploadExcelBoxKitFile' }
//         }
//       };
//     }

//   } catch (err) {
//     console.error('server error:', err);
//     return {
//       code: 500,
//       message: {
//         translationKey: 'excel.error_server',
//         translationParams: { name: 'uploadExcelBoxKitFile' }
//       }
//     };
//   }
// };

export const uploadExcelShipmentDataFile = async (
  fileBuffer: Buffer,
  idCompany: number,
  fileName: string
): Promise<IresponseRepositoryService> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as unknown as any);

    const worksheet = workbook.getWorksheet('ShipmentDataFile') || workbook.worksheets[0];
    if (!worksheet) {
      return {
        code: 400,
        message: {
          translationKey: 'excel.templateFileNotFound',
          translationParams: { name: 'uploadExcelBoxKitFile' }
        }
      };
    }

    const db = await connectToSqlServer();
    const transaction = new sql.Transaction(db);
    await transaction.begin();

    const getOrderRequest = new sql.Request(transaction);
    getOrderRequest.input('idCompany', sql.Int, idCompany);
    const orderResult = await getOrderRequest.query(`
      SELECT TOP 1 id FROM TB_Order WHERE idCompany = @idCompany ORDER BY createAt DESC;
    `);

    if (orderResult.recordset.length === 0) {
      await transaction.rollback();
      return {
        code: 404,
        message: {
          translationKey: 'order.notFound',
          translationParams: { idCompany }
        }
      };
    }

    const idOrder = orderResult.recordset[0].id;

    await new sql.Request(transaction)
      .input('idOrder', sql.Int, idOrder)
      .input('idStatusData', sql.Int, 3)
      .query(`UPDATE TB_Order SET idStatusData = @idStatusData WHERE id = @idOrder;`);

    await new sql.Request(transaction)
      .input('fileName', sql.VarChar(255), fileName)
      .input('fileType', sql.VarChar(100), 'ShipmentDataFile')
      .input('idOrder', sql.Int, idOrder)
      .query(`INSERT INTO TB_NameFile (fileName, fileType, uploadedAt, idOrder)
              VALUES (@fileName, @fileType, GETDATE(), @idOrder);`);

    const boxKitQuery = await new sql.Request(transaction)
      .input('idOrder', sql.Int, idOrder)
      .query(`SELECT * FROM TB_BoxKitFile WHERE idOrder = @idOrder ORDER BY length ASC`);
    const boxKit = boxKitQuery.recordset;

    const insertQuery = `
      INSERT INTO TB_ShipmentDataFile (
        orderId, item1Length, item1Width, item1Height, item1Weight,
        item2Length, item2Width, item2Height, item2Weight,
        item3Length, item3Width, item3Height, item3Weight,
        item4Length, item4Width, item4Height, item4Weight,
        item5Length, item5Width, item5Height, item5Weight,
        cubedItemLength, cubedItemWidth, cubedItemHeight, cubedItemWeight,
        currentAssignedBoxLength, currentAssignedBoxWidth, currentAssignedBoxHeight,
        idOrder, createAt, cubingMethod
      ) VALUES (
        @orderId, @item1Length, @item1Width, @item1Height, @item1Weight,
        @item2Length, @item2Width, @item2Height, @item2Weight,
        @item3Length, @item3Width, @item3Height, @item3Weight,
        @item4Length, @item4Width, @item4Height, @item4Weight,
        @item5Length, @item5Width, @item5Height, @item5Weight,
        @cubedItemLength, @cubedItemWidth, @cubedItemHeight, @cubedItemWeight,
        @currentAssignedBoxLength, @currentAssignedBoxWidth, @currentAssignedBoxHeight,
        @idOrder, GETDATE(), @cubingMethod
      );
    `;

    const rowsToInsert = extractRowsFromWorksheet(worksheet) as ShipmentRow[];
    if (rowsToInsert.length === 0) {
      await transaction.rollback();
      return {
        code: 400,
        message: {
          translationKey: 'excel.noValidRows',
          translationParams: {}
        }
      };
    }

    let insertedRows = 0;

    for (const row of rowsToInsert) {
      try {
        const request = new sql.Request(transaction);
        let cubingMethod = 'original';

        let itemLength = parseDecimalValue(row.cubedItemLength);
        let itemWidth = parseDecimalValue(row.cubedItemWidth);
        let itemHeight = parseDecimalValue(row.cubedItemHeight);
        let itemWeight = parseDecimalValue(row.cubedItemWeight);

        const isMissingCubedDimensions =
          !itemLength || itemLength === 0 ||
          !itemWidth || itemWidth === 0 ||
          !itemHeight || itemHeight === 0 ||
          !itemWeight || itemWeight === 0;

        if (isMissingCubedDimensions) {
          const result = applyAABBHeuristic(row);
          if (result.length > 0) {
            itemLength = result[0].cubedItemLength;
            itemWidth = result[0].cubedItemWidth;
            itemHeight = result[0].cubedItemHeight;
            itemWeight = result[0].cubedItemWeight;
            cubingMethod = result[0].cubingMethod || 'heuristic';
          }
        }

        let currentLength = parseDecimalValue(row.currentAssignedBoxLength);
        let currentWidth = parseDecimalValue(row.currentAssignedBoxWidth);
        let currentHeight = parseDecimalValue(row.currentAssignedBoxHeight);

        const needsAssignment =
          !currentLength || currentLength === 0 ||
          !currentWidth || currentWidth === 0 ||
          !currentHeight || currentHeight === 0;

       if (
          needsAssignment &&
          boxKit.length > 0 &&
          itemLength != null &&
          itemWidth != null &&
          itemHeight != null
        ) {
          const safeItemLength = itemLength;
          const safeItemWidth = itemWidth;
          const safeItemHeight = itemHeight;

          const box = boxKit.find(box =>
            box.length >= safeItemLength &&
            box.width >= safeItemWidth &&
            box.height >= safeItemHeight
          );

          if (box) {
            currentLength = box.length;
            currentWidth = box.width;
            currentHeight = box.height;
          } else {
            const fallback = boxKit[boxKit.length - 1];
            currentLength = fallback.length;
            currentWidth = fallback.width;
            currentHeight = fallback.height;
            cubingMethod = 'noBoxFit';
          }
        }

        request.input('orderId', sql.Decimal(10, 2), parseDecimalValue(row.orderId));
        for (let i = 1; i <= 5; i++) {
          request.input(
            `item${i}Length`,
            sql.Decimal(10, 2),
            parseDecimalValue((row as Record<string, number | null>)[`item${i}Length`])
          );
          request.input(
            `item${i}Width`,
            sql.Decimal(10, 2),
            parseDecimalValue((row as Record<string, number | null>)[`item${i}Width`])
          );
          request.input(
            `item${i}Height`,
            sql.Decimal(10, 2),
            parseDecimalValue((row as Record<string, number | null>)[`item${i}Height`])
          );
          request.input(
            `item${i}Weight`,
            sql.Decimal(10, 2),
            parseDecimalValue((row as Record<string, number | null>)[`item${i}Weight`])
          );
        }

        request.input('cubedItemLength', sql.Decimal(10, 2), itemLength);
        request.input('cubedItemWidth', sql.Decimal(10, 2), itemWidth);
        request.input('cubedItemHeight', sql.Decimal(10, 2), itemHeight);
        request.input('cubedItemWeight', sql.Decimal(10, 2), itemWeight);
        request.input('currentAssignedBoxLength', sql.Decimal(10, 2), currentLength);
        request.input('currentAssignedBoxWidth', sql.Decimal(10, 2), currentWidth);
        request.input('currentAssignedBoxHeight', sql.Decimal(10, 2), currentHeight);
        request.input('idOrder', sql.Int, idOrder);
        request.input('cubingMethod', sql.VarChar(50), cubingMethod);

        await request.query(insertQuery);
        insertedRows++;
      } catch (error) {
        console.error(`Error inserting row for orderId ${idOrder}`, error);
      }
    }

    if (insertedRows > 0) {
      await transaction.commit();
      return {
        code: 200,
        message: {
          translationKey: 'excel.template_generated',
          translationParams: { name: 'uploadExcelBoxKitFile' }
        }
      };
    } else {
      await transaction.rollback();
      return {
        code: 400,
        message: {
          translationKey: 'excel.noRowsInserted',
          translationParams: { name: 'uploadExcelBoxKitFile' }
        }
      };
    }

  } catch (err) {
    console.error('server error:', err);
    return {
      code: 500,
      message: {
        translationKey: 'excel.error_server',
        translationParams: { name: 'uploadExcelBoxKitFile' }
      }
    };
  }
};

const parseDecimalValue = (value: any): number | null => {
    const num = Number(value);
    return isNaN(num) ? null : num;
};

export const getItemsLargestAspectRatioByIdOrder = async (
  idOrder: number
): Promise<any[]> => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const query = `
    SELECT TOP 10
      idOrder,
      orderId,
      idShipmenDataFile,
      itemNumber,
      itemLength,
      itemWidth,
      itemHeight,
      itemWeight,
      itemLength / NULLIF(itemWidth, 0) AS aspectRatio,
      itemLength * itemWidth AS itemArea
    FROM (
      SELECT 
        @idOrder AS idOrder,
        s.orderId,
        s.id AS idShipmenDataFile,
        'Item 1' AS itemNumber,
        s.item1Length AS itemLength,
        s.item1Width AS itemWidth,
        s.item1Height AS itemHeight,
        s.item1Weight AS itemWeight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item1Length IS NOT NULL AND s.item1Width IS NOT NULL

      UNION ALL

      SELECT 
        @idOrder, s.id, s.orderId, 'Item 2', s.item2Length, s.item2Width, s.item2Height, s.item2Weight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item2Length IS NOT NULL AND s.item2Width IS NOT NULL

      UNION ALL

      SELECT 
        @idOrder, s.id, s.orderId, 'Item 3', s.item3Length, s.item3Width, s.item3Height, s.item3Weight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item3Length IS NOT NULL AND s.item3Width IS NOT NULL

      UNION ALL

      SELECT 
        @idOrder, s.id, s.orderId, 'Item 4', s.item4Length, s.item4Width, s.item4Height, s.item4Weight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item4Length IS NOT NULL AND s.item4Width IS NOT NULL

      UNION ALL

      SELECT 
        @idOrder, s.id, s.orderId, 'Item 5', s.item5Length, s.item5Width, s.item5Height, s.item5Weight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item5Length IS NOT NULL AND s.item5Width IS NOT NULL
    ) AS items
    ORDER BY itemLength * itemWidth DESC;
  `;

  const result = await db
    .request()
    .input("idOrder", idOrder)
    .query(query);

  return result.recordset;
};

export const getItemsLargestVoidVolumeByIdOrder = async (
  idOrder: number
): Promise<any[]> => {
  const db = await connectToSqlServer();
  if (!db) throw new Error("No se pudo conectar a la base de datos");

  const query = `
    SELECT TOP 10
      idOrder,
      orderId,
      idShipmenDataFile,
      itemNumber,
      itemLength,
      itemWidth,
      itemHeight,
      itemWeight,
      currentAssignedBoxLength,
      currentAssignedBoxWidth,
      currentAssignedBoxHeight,
      (currentAssignedBoxLength * currentAssignedBoxWidth * currentAssignedBoxHeight) -
      (itemLength * itemWidth * itemHeight) AS voidVolume
    FROM (
      SELECT 
        @idOrder AS idOrder,
        s.orderId,
        s.id AS idShipmenDataFile,
        'Item 1' AS itemNumber,
        s.item1Length AS itemLength,
        s.item1Width AS itemWidth,
        s.item1Height AS itemHeight,
        s.item1Weight AS itemWeight,
        s.currentAssignedBoxLength,
        s.currentAssignedBoxWidth,
        s.currentAssignedBoxHeight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item1Length IS NOT NULL AND s.item1Width IS NOT NULL AND s.item1Height IS NOT NULL

      UNION ALL

      SELECT 
        @idOrder, s.orderId, s.id, 'Item 2', s.item2Length, s.item2Width, s.item2Height, s.item2Weight,
        s.currentAssignedBoxLength, s.currentAssignedBoxWidth, s.currentAssignedBoxHeight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item2Length IS NOT NULL AND s.item2Width IS NOT NULL AND s.item2Height IS NOT NULL

      UNION ALL

      SELECT 
        @idOrder, s.orderId, s.id, 'Item 3', s.item3Length, s.item3Width, s.item3Height, s.item3Weight,
        s.currentAssignedBoxLength, s.currentAssignedBoxWidth, s.currentAssignedBoxHeight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item3Length IS NOT NULL AND s.item3Width IS NOT NULL AND s.item3Height IS NOT NULL

      UNION ALL

      SELECT 
        @idOrder, s.orderId, s.id, 'Item 4', s.item4Length, s.item4Width, s.item4Height, s.item4Weight,
        s.currentAssignedBoxLength, s.currentAssignedBoxWidth, s.currentAssignedBoxHeight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item4Length IS NOT NULL AND s.item4Width IS NOT NULL AND s.item4Height IS NOT NULL

      UNION ALL

      SELECT 
        @idOrder, s.orderId, s.id, 'Item 5', s.item5Length, s.item5Width, s.item5Height, s.item5Weight,
        s.currentAssignedBoxLength, s.currentAssignedBoxWidth, s.currentAssignedBoxHeight
      FROM TB_ShipmentDataFile s
      WHERE s.idOrder = @idOrder AND s.item5Length IS NOT NULL AND s.item5Width IS NOT NULL AND s.item5Height IS NOT NULL
    ) AS items
    ORDER BY 
      (currentAssignedBoxLength * currentAssignedBoxWidth * currentAssignedBoxHeight) -
      (itemLength * itemWidth * itemHeight) DESC;
  `;

  const result = await db
    .request()
    .input("idOrder", idOrder)
    .query(query);

  return result.recordset;
};
