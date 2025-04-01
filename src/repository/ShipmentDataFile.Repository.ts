import * as ExcelJS from 'exceljs';
import { IresponseRepositoryService } from '../interface/ShipmentDataFile.Interface';

export const generateExcelTemplateShipmentDataFile = async (): Promise<IresponseRepositoryService> => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ShipmentDataFile');

        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 15 },
            { header: 'Item 1 Length', key: 'item1Length', width: 15 },
            { header: 'Item 1 Width', key: 'item1Width', width: 15 },
            { header: 'Item 1 Height', key: 'heigitem1Heightht', width: 15 },
            { header: 'Item 1 Weight', key: 'item1Weight', width: 15 },
            { header: 'Item 2 Length', key: 'item2Length', width: 15 },
            { header: 'Item 2 Width', key: 'item2Width', width: 15 },
            { header: 'Item 2 Height', key: 'heigitem2Heightht', width: 15 },
            { header: 'Item 2 Weight', key: 'item2Weight', width: 15 },
            { header: 'Item 3 Length', key: 'item3Length', width: 15 },
            { header: 'Item 3 Width', key: 'item3Width', width: 15 },
            { header: 'Item 3 Height', key: 'heigitem3Heightht', width: 15 },
            { header: 'Item 3 Weight', key: 'item3Weight', width: 15 },
            { header: 'Item 4 Length', key: 'item4Length', width: 15 },
            { header: 'Item 4 Width', key: 'item4Width', width: 15 },
            { header: 'Item 4 Height', key: 'heigitem4Heightht', width: 15 },
            { header: 'Item 4 Weight', key: 'item4Weight', width: 15 },
            { header: 'Item 5 Length', key: 'item5Length', width: 15 },
            { header: 'Item 5 Width', key: 'item5Width', width: 15 },
            { header: 'Item 5 Height', key: 'heigitem5Heightht', width: 15 },
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