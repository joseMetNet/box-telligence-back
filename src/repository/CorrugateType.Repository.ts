import { connectToSqlServer } from "../DB/config";
import { IresponseRepositoryService } from "../interface/CorrugateType.Interface";

export const getCorrugateType = async (): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const query = `SELECT * FROM TB_CorrugateType`;
        const result = await db?.request().query(query);

        return {
            code: 200,
            message: { translationKey: "corrugateType.found", translationParams: { name: "getCorrugateType" } },
            data: result?.recordset || []
        };
    } catch (err) {
        console.log("Error fetching corrugateType", err);
        return {
            code: 500,
            message: { translationKey: "corrugateType.error_server", translationParams: { name: "getCorrugateType" } },
        };
    }
};