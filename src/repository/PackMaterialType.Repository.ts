import { connectToSqlServer } from "../DB/config";
import { IresponseRepositoryService } from "../interface/PackMaterialType.Interface";

export const getPackMaterialType = async (): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const query = `SELECT * FROM TB_PackMaterialType`;
        const result = await db?.request().query(query);

        return {
            code: 200,
            message: { translationKey: "packMaterialType.found", translationParams: { name: "getPackMaterialType" } },
            data: result?.recordset || []
        };
    } catch (err) {
        console.log("Error fetching box dimensions", err);
        return {
            code: 500,
            message: { translationKey: "packMaterialType.error_server", translationParams: { name: "getPackMaterialType" } },
        };
    }
};