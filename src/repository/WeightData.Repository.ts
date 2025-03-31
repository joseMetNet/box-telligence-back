import { connectToSqlServer } from "../DB/config";
import { IresponseRepositoryService } from "../interface/WeightData.Interface";

export const getWeightData = async (): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const query = `SELECT * FROM TB_WeightData`;
        const result = await db?.request().query(query);

        return {
            code: 200,
            message: { translationKey: "weightData.found", translationParams: { name: "getWeightData" } },
            data: result?.recordset || []
        };
    } catch (err) {
        console.log("Error fetching box dimensions", err);
        return {
            code: 500,
            message: { translationKey: "weightData.error_server", translationParams: { name: "getWeightData" } },
        };
    }
};