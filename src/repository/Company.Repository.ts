import { connectToSqlServer } from "../DB/config";
import { ICompany, IGetCompaniesParams, IresponseRepositoryService } from "../interface/Company.Interface";

export const createCompany = async (data: ICompany): Promise<IresponseRepositoryService> => {
    try {
        const {
            company, location, idUser, currentBoxUsed, runCurrentBoxKitOnly,
            minimunNumBox, maximunNumBox, orderUsed, weightDataAvailable, idWeightData, idBoxDimension, assignedBoxes,
            itemClearanceRuleUsed, clearanceAmount, multipleItemsPreCubed, idFreightChargeMethod,
            dimWeightFactor, idPackMaterial, packMaterialCost, corrugateType, corrugateCost, freightCostPerLb
        } = data;

        const db = await connectToSqlServer();

        const insertCompanyQuery = `INSERT INTO TB_Companies (
            company, location, idUser, currentBoxUsed, runCurrentBoxKitOnly,
            minimunNumBox, maximunNumBox, orderUsed, weightDataAvailable, idWeightData, idBoxDimension, assignedBoxes,
            itemClearanceRuleUsed, clearanceAmount, multipleItemsPreCubed, idFreightChargeMethod,
            dimWeightFactor, idPackMaterial, packMaterialCost, corrugateType, corrugateCost, freightCostPerLb, createAt
        ) OUTPUT INSERTED.* VALUES (
            @company, @location, @idUser, @currentBoxUsed, @runCurrentBoxKitOnly,
            @minimunNumBox, @maximunNumBox, @orderUsed, @weightDataAvailable, @idWeightData, @idBoxDimension, @assignedBoxes,
            @itemClearanceRuleUsed, @clearanceAmount, @multipleItemsPreCubed, @idFreightChargeMethod,
            @dimWeightFactor, @idPackMaterial, @packMaterialCost, @corrugateType, @corrugateCost, @freightCostPerLb, GETDATE()
        )`;

        const insertCompanyResult = await db?.request()
            .input('company', company)
            .input('location', location)
            .input('idUser', idUser)
            .input('currentBoxUsed', currentBoxUsed)
            .input('runCurrentBoxKitOnly', runCurrentBoxKitOnly)
            .input('minimunNumBox', minimunNumBox)
            .input('maximunNumBox', maximunNumBox)
            .input('orderUsed', orderUsed)
            .input('weightDataAvailable', weightDataAvailable)
            .input('idWeightData', idWeightData)
            .input('idBoxDimension', idBoxDimension)
            .input('assignedBoxes', assignedBoxes)
            .input('itemClearanceRuleUsed', itemClearanceRuleUsed)
            .input('clearanceAmount', clearanceAmount)
            .input('multipleItemsPreCubed', multipleItemsPreCubed)
            .input('idFreightChargeMethod', idFreightChargeMethod)
            .input('dimWeightFactor', dimWeightFactor)
            .input('idPackMaterial', idPackMaterial)
            .input('packMaterialCost', packMaterialCost)
            .input('corrugateType', corrugateType || null)
            .input('corrugateCost', corrugateCost)
            .input('freightCostPerLb', freightCostPerLb)
            .query(insertCompanyQuery);

        const createdCompany = insertCompanyResult?.recordset?.[0];
        const idCompany = createdCompany?.id;

        if (!idCompany) {
            throw new Error("No se pudo obtener el id de la empresa creada.");
        }

        const insertOrderQuery = `
            INSERT INTO TB_Order (idCompany, idStatusData, idStatusModel, createAt)
            VALUES (@idCompany, @idStatusData, @idStatusModel, GETDATE())
        `;

        await db?.request()
            .input('idCompany', idCompany)
            .input('idStatusData', 1)
            .input('idStatusModel', 1)
            .query(insertOrderQuery);

        return {
            code: 200,
            message: { translationKey: "company.created", translationParams: { name: "createCompany" } },
            data: createdCompany
        };
    } catch (err) {
        console.log("Error creating company", err);
        return {
            code: 400,
            message: { translationKey: "company.error_server", translationParams: { name: "createCompany" } },
        };
    }
};

export const getNewCompanies = async ({ page = 1, limit = 10 }: IGetCompaniesParams): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const offset = (page - 1) * limit;

        const query = `
            SELECT DISTINCT tbc.company, tbc.createAt, tbsd.id,
            CASE 
                WHEN tbsd.id = 1 THEN 0
                WHEN tbsd.id = 2 THEN 50
                WHEN tbsd.id = 3 THEN 100
                ELSE NULL
            END AS percentage,
            tbsd.status AS statusData,
            tbsm.status AS statusModel
            FROM TB_Companies AS tbc 
            LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
            LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
            LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
			WHERE tbsd.id = 1
            ORDER BY tbc.createAt DESC
            OFFSET ${offset} ROWS
            FETCH NEXT ${limit} ROWS ONLY;
        `;

        const countQuery = `SELECT COUNT(*) as total FROM TB_Companies AS tbc 
            LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
            LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
            LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
			WHERE tbsd.id = 1`;

        const [dataResult, countResult] = await Promise.all([
            db?.request().query(query),
            db?.request().query(countQuery)
        ]);

        const total = countResult?.recordset[0].total || 0;

        return {
            code: 200,
            message: { translationKey: "company.found", translationParams: { name: "getNewCompanies" } },
            data: {
                companies: dataResult?.recordset || [],
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        };
    } catch (err) {
        console.error("Error fetching companies:", err);
        return {
            code: 400,
            message: { translationKey: "company.error_server", translationParams: { name: "getNewCompanies" } },
        };
    }
}

export const getOlderCompanies = async ({ page = 1, limit = 10 }: IGetCompaniesParams): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const offset = (page - 1) * limit;

        const query = `
            SELECT DISTINCT tbc.company, tbc.currentBoxUsed, tbc.createAt, tbsd.id,
            CASE 
                WHEN tbsd.id = 1 THEN 0
                WHEN tbsd.id = 2 THEN 50
                WHEN tbsd.id = 3 THEN 100
                ELSE NULL
            END AS percentage,
            tbsd.status AS statusData,
            tbsm.status AS statusModel
            FROM TB_Companies AS tbc 
            LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
            LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
            LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
            WHERE tbc.createAt < DATEADD(MONTH, -6, GETDATE())
            ORDER BY tbc.createAt DESC
            OFFSET ${offset} ROWS
            FETCH NEXT ${limit} ROWS ONLY;
        `;

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM TB_Companies AS tbc 
            LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
            LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
            LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
            WHERE tbc.createAt < DATEADD(MONTH, -6, GETDATE())
        `;

        const [dataResult, countResult] = await Promise.all([
            db?.request().query(query),
            db?.request().query(countQuery)
        ]);

        const total = countResult?.recordset[0].total || 0;

        return {
            code: 200,
            message: { translationKey: "company.found", translationParams: { name: "getOlderCompanies" } },
            data: {
                companies: dataResult?.recordset || [],
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        };
    } catch (err) {
        console.error("Error fetching older companies:", err);
        return {
            code: 400,
            message: { translationKey: "company.error_server", translationParams: { name: "getOlderCompanies" } },
        };
    }
};

export const getCompanies = async ({ page = 1, limit = 10 }: IGetCompaniesParams): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const offset = (page - 1) * limit;

        const query = `
            SELECT DISTINCT tbc.company, tbc.createAt, tbsd.id,
            CASE 
                WHEN tbsd.id = 1 THEN 0
                WHEN tbsd.id = 2 THEN 50
                WHEN tbsd.id = 3 THEN 100
                ELSE NULL
            END AS percentage,
            tbsd.status AS statusData,
            tbsm.status AS statusModel
            FROM TB_Companies AS tbc 
            LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
            LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
            LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
			WHERE tbsm.id != 2 AND tbsd.id != 1
            ORDER BY tbc.createAt DESC
            OFFSET ${offset} ROWS
            FETCH NEXT ${limit} ROWS ONLY;
        `;

        const countQuery = `SELECT COUNT(*) as total FROM TB_Companies AS tbc 
            LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
            LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
            LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
			WHERE tbsm.id !=  2 AND tbsd.id != 1`;

        const [dataResult, countResult] = await Promise.all([
            db?.request().query(query),
            db?.request().query(countQuery)
        ]);

        const total = countResult?.recordset[0].total || 0;

        return {
            code: 200,
            message: { translationKey: "company.found", translationParams: { name: "getCompanies" } },
            data: {
                companies: dataResult?.recordset || [],
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        };
    } catch (err) {
        console.error("Error fetching companies:", err);
        return {
            code: 400,
            message: { translationKey: "company.error_server", translationParams: { name: "getCompanies" } },
        };
    }
}
