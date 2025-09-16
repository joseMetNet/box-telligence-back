import * as ExcelJS from 'exceljs';
import { IresponseRepositoryService } from '../interface/BoxKitFile.Interface';
import { connectToSqlServer } from '../DB/config';
import sql from 'mssql';

export const generateExcelTemplateBoxKitFile = async (): Promise<IresponseRepositoryService> => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('BoxKitFile');

        worksheet.columns = [
            { header: 'boxNumber', key: 'boxNumber', width: 15 },
            { header: 'length', key: 'length', width: 15 },
            { header: 'width', key: 'width', width: 15 },
            { header: 'height', key: 'height', width: 15 }
        ];

        const buffer = await workbook.xlsx.writeBuffer();

        return {
            code: 200,
            message: { translationKey: 'excel.template_generated', translationParams: { name: "generateExcelTemplateBoxKitFile" } },
            data: buffer
        };
    } catch (err) {
        console.error('Error generating Excel template:', err);
        return {
            code: 500,
            message: { translationKey: 'excel.error_server', translationParams: { name: "generateExcelTemplateBoxKitFile" } }
        };
    }
};

export const uploadExcelBoxKitFile = async (
  fileBuffer: Buffer,
  idCompany: number,
  fileName: string
): Promise<IresponseRepositoryService> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as unknown as any);

    const worksheet = workbook.getWorksheet('BoxKitFile') || workbook.worksheets[0];
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

    const updateStatusRequest = new sql.Request(transaction);
    updateStatusRequest.input('idOrder', sql.Int, idOrder);
    updateStatusRequest.input('idStatusData', sql.Int, 2);
    await updateStatusRequest.query(`
      UPDATE TB_Order SET idStatusData = @idStatusData WHERE id = @idOrder;
    `);

    const insertNameFileRequest = new sql.Request(transaction);
    insertNameFileRequest.input('fileName', sql.VarChar(255), fileName);
    insertNameFileRequest.input('fileType', sql.VarChar(100), 'BoxKitFile');
    insertNameFileRequest.input('idOrder', sql.Int, idOrder);
    await insertNameFileRequest.query(`
      INSERT INTO TB_NameFile (fileName, fileType, uploadedAt, idOrder)
      VALUES (@fileName, @fileType, GETDATE(), @idOrder);
    `);

    const insertQuery = `
      INSERT INTO TB_BoxKitFile (boxNumber, length, width, height, idOrder, createAt)
      VALUES (@boxNumber, @length, @width, @height, @idOrder, GETDATE());
    `;

    const rowsToInsert = extractRowsFromWorksheet(worksheet);

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
        request.input('boxNumber', sql.Int, row.boxNumber);
        request.input('length', sql.Decimal(10, 2), row.length);
        request.input('width', sql.Decimal(10, 2), row.width);
        request.input('height', sql.Decimal(10, 2), row.height);
        request.input('idOrder', sql.Int, idOrder);

        await request.query(insertQuery);
        insertedRows++;
      } catch (error) {
        console.error(`Error inserting row - Box: ${row.boxNumber}`, error);
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
const extractRowsFromWorksheet = (worksheet: ExcelJS.Worksheet) => {
    const rows = [];
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        const boxNumber = row.getCell(1).value;
        const length = row.getCell(2).value;
        const width = row.getCell(3).value;
        const height = row.getCell(4).value;

        if (boxNumber && length && width && height) {
            rows.push({ boxNumber, length, width, height });
        } else {
            console.warn(`Row ${rowNumber} omitted due to incomplete data.`);
        }
    }
    return rows;
};