import { connectToSqlServer } from "../DB/config";
import { IresponseRepositoryService } from "../interface/FreightChargeMethod.Interface";

export const getFreightChargeMethod = async (): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const query = `SELECT * FROM TB_FreightChargeMethod`;
        const result = await db?.request().query(query);

        return {
            code: 200,
            message: { translationKey: "TB_freightChargeMethod.found", translationParams: { name: "getFreightChargeMethod" } },
            data: result?.recordset || []
        };
    } catch (err) {
        console.log("Error fetching freightChargeMethod", err);
        return {
            code: 500,
            message: { translationKey: "freightChargeMethod.error_server", translationParams: { name: "getFreightChargeMethod" } },
        };
    }
};