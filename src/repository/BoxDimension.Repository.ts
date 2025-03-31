
import { connectToSqlServer } from "../DB/config";
import { IresponseRepositoryService } from "../interface/BoxDimension.Interface";

export const getBoxDimensions = async (): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const query = `SELECT * FROM TB_BoxDimension`;
        const result = await db?.request().query(query);

        return {
            code: 200,
            message: { translationKey: "boxDimension.found", translationParams: { name: "getBoxDimensions" } },
            data: result?.recordset || []
        };
    } catch (err) {
        console.log("Error fetching box dimensions", err);
        return {
            code: 500,
            message: { translationKey: "boxDimension.error_server", translationParams: { name: "getBoxDimensions" } },
        };
    }
};
