import * as ExcelJS from 'exceljs';
import { IresponseRepositoryService } from '../interface/BoxKitFile.Interface';


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