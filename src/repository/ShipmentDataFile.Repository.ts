import * as ExcelJS from 'exceljs';
import { IresponseRepositoryService } from '../interface/ShipmentDataFile.Interface';
import { connectToSqlServer } from '../DB/config';
import sql from 'mssql';

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


export const uploadExcelShipmentDataFile = async (fileBuffer: Buffer, idCompany: number): Promise<IresponseRepositoryService> => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);

        const worksheet = workbook.getWorksheet('ShipmentDataFile') || workbook.worksheets[0];
        if (!worksheet) {
            return { code: 400, message: { translationKey: "excel.templateFileNotFound", translationParams: { name: "uploadExcelBoxKitFile" } } };
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
            return { code: 404, message: { translationKey: "order.notFound", translationParams: { idCompany } } };
        }

        const idOrder = orderResult.recordset[0].id;
                const updateStatusRequest = new sql.Request(transaction);
                      updateStatusRequest.input('idOrder', sql.Int, idOrder);
                      updateStatusRequest.input('idStatusData', sql.Int, 3);
                    await updateStatusRequest.query(`
                        UPDATE TB_Order SET idStatusData = @idStatusData WHERE id = @idOrder;
                    `);
        const insertQuery = `
            INSERT INTO TB_ShipmentDataFile (orderId, item1Length, item1Width, item1Height, item1Weight,
            item2Length, item2Width, item2Height, item2Weight,
            item3Length, item3Width, item3Height, item3Weight,
            item4Length, item4Width, item4Height, item4Weight,
            item5Length, item5Width, item5Height, item5Weight,
            cubedItemLength, cubedItemWidth, cubedItemHeight, cubedItemWeight,
            currentAssignedBoxLength, currentAssignedBoxWidth, currentAssignedBoxHeight, idOrder, createAt) 
            VALUES (@orderId, @item1Length, @item1Width, @item1Height, @item1Weight,
            @item2Length, @item2Width, @item2Height, @item2Weight,
            @item3Length, @item3Width, @item3Height, @item3Weight,
            @item4Length, @item4Width, @item4Height, @item4Weight,
            @item5Length, @item5Width, @item5Height, @item5Weight, 
            @cubedItemLength, @cubedItemWidth, @cubedItemHeight, @cubedItemWeight,
            @currentAssignedBoxLength, @currentAssignedBoxWidth, @currentAssignedBoxHeight, @idOrder, GETDATE());
        `;

        const rowsToInsert = extractRowsFromWorksheet(worksheet);
        if (rowsToInsert.length === 0) {
            await transaction.rollback();
            return { code: 400, message: { translationKey: "excel.noValidRows", translationParams: {} } };
        }

        let insertedRows = 0;

        for (const row of rowsToInsert) {
            try {
                const request = new sql.Request(transaction);
                request.input('orderId', sql.Int, row.orderId);
                request.input('item1Length', sql.Decimal(10, 2), parseDecimalValue(row.item1Length));
                request.input('item1Width', sql.Decimal(10, 2), parseDecimalValue(row.item1Width));
                request.input('item1Height', sql.Decimal(10, 2), parseDecimalValue(row.item1Height));
                request.input('item1Weight', sql.Decimal(10, 2), parseDecimalValue(row.item1Weight));
                request.input('item2Length', sql.Decimal(10, 2), parseDecimalValue(row.item2Length));
                request.input('item2Width', sql.Decimal(10, 2), parseDecimalValue(row.item2Width));
                request.input('item2Height', sql.Decimal(10, 2), parseDecimalValue(row.item2Height));
                request.input('item2Weight', sql.Decimal(10, 2), parseDecimalValue(row.item2Weight));
                request.input('item3Length', sql.Decimal(10, 2), parseDecimalValue(row.item3Length));
                request.input('item3Width', sql.Decimal(10, 2), parseDecimalValue(row.item3Width));
                request.input('item3Height', sql.Decimal(10, 2), parseDecimalValue(row.item3Height));
                request.input('item3Weight', sql.Decimal(10, 2), parseDecimalValue(row.item3Weight));
                request.input('item4Length', sql.Decimal(10, 2), parseDecimalValue(row.item4Length));
                request.input('item4Width', sql.Decimal(10, 2), parseDecimalValue(row.item4Width));
                request.input('item4Height', sql.Decimal(10, 2), parseDecimalValue(row.item4Height));
                request.input('item4Weight', sql.Decimal(10, 2), parseDecimalValue(row.item4Weight));
                request.input('item5Length', sql.Decimal(10, 2), parseDecimalValue(row.item5Length));
                request.input('item5Width', sql.Decimal(10, 2), parseDecimalValue(row.item5Width));
                request.input('item5Height', sql.Decimal(10, 2), parseDecimalValue(row.item5Height));
                request.input('item5Weight', sql.Decimal(10, 2), parseDecimalValue(row.item5Weight));
                request.input('cubedItemLength', sql.Decimal(10, 2), parseDecimalValue(row.cubedItemLength));
                request.input('cubedItemWidth', sql.Decimal(10, 2), parseDecimalValue(row.cubedItemWidth));
                request.input('cubedItemHeight', sql.Decimal(10, 2), parseDecimalValue(row.cubedItemHeight));
                request.input('cubedItemWeight', sql.Decimal(10, 2), parseDecimalValue(row.cubedItemWeight));
                request.input('currentAssignedBoxLength', sql.Decimal(10, 2), parseDecimalValue(row.currentAssignedBoxLength));
                request.input('currentAssignedBoxWidth', sql.Decimal(10, 2), parseDecimalValue(row.currentAssignedBoxWidth));
                request.input('currentAssignedBoxHeight', sql.Decimal(10, 2), parseDecimalValue(row.currentAssignedBoxHeight));
                request.input('idOrder', sql.Int, idOrder);

                await request.query(insertQuery);
                insertedRows++;
            } catch (error) {
                console.error(`Error inserting row - Box: ${row.orderId}`, error);
            }
        }

        if (insertedRows > 0) {
            await transaction.commit();
            return {
                code: 200,
                message: { translationKey: "excel.template_generated", translationParams: { name: "uploadExcelBoxKitFile" } }
            };
        } else {
            await transaction.rollback();
            return { code: 400, message: { translationKey: "excel.noRowsInserted", translationParams: { name: "uploadExcelBoxKitFile" } } };
        }

    } catch (err) {
        console.error("server error:", err);
        return { code: 500, message: { translationKey: "excel.error_server", translationParams: { name: "uploadExcelBoxKitFile" } } };
    }
};

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

const parseDecimalValue = (value: any): number | null => {
    const num = Number(value);
    return isNaN(num) ? null : num;
};
