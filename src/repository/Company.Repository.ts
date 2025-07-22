import { connectToSqlServer } from "../DB/config";
import { ICompany, IGetCompaniesParams, IresponseRepositoryService } from "../interface/Company.Interface";

export const createCompany = async (data: ICompany): Promise<IresponseRepositoryService> => {
    try {
        const { company, location, idUser } = data;
        const db = await connectToSqlServer();

        const insertCompanyQuery = `INSERT INTO TB_Companies (
            company, location, idUser) OUTPUT INSERTED.* VALUES (
            @company, @location, @idUser)`;

        const insertCompanyResult = await db?.request()
            .input('company', company)
            .input('location', location)
            .input('idUser', idUser)
            .query(insertCompanyQuery);

        const createdCompany = insertCompanyResult?.recordset?.[0];
        const idCompany = createdCompany?.id;

        if (!idCompany) {
            throw new Error("Could not retrieve the ID of the created company.");
        }

        const idOrder = await createOrder(db, idCompany);
        await createAttributeDataInternal(db, data, idOrder, idCompany);

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
            WITH OrderedData AS (
                SELECT
                    tbc.id AS companyId,
                    tbc.company,
                    tbo.createAt,
                    tbsd.id AS statusDataId,
                    CASE 
                        WHEN tbsd.id = 1 THEN 0
                        WHEN tbsd.id = 2 THEN 50
                        WHEN tbsd.id = 3 THEN 100
                        ELSE NULL
                    END AS percentage,
                    tbsd.status AS statusData,
                    tbsm.status AS statusModel,
                    ROW_NUMBER() OVER (PARTITION BY tbc.id ORDER BY tbo.createAt DESC) AS rn
                FROM TB_Companies AS tbc 
                LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
                LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
                LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
                WHERE tbsd.id = 1 AND tbo.createAt > DATEADD(MONTH, -6, GETDATE())
            )
            SELECT 
                companyId AS id,
                company,
                createAt,
                percentage,
                statusData,
                statusModel
            FROM OrderedData
            WHERE rn = 1
            ORDER BY createAt DESC
            OFFSET ${offset} ROWS
            FETCH NEXT ${limit} ROWS ONLY;
        `;

        const countQuery = `
            WITH OrderedData AS (
                SELECT 
                    tbc.id AS companyId,
                    ROW_NUMBER() OVER (PARTITION BY tbc.id ORDER BY tbo.createAt DESC) AS rn
                FROM TB_Companies AS tbc 
                LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
                LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
                WHERE tbsd.id = 1 AND tbo.createAt > DATEADD(MONTH, -6, GETDATE())
            )
            SELECT COUNT(*) as total
            FROM OrderedData
            WHERE rn = 1;
        `;

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
};

export const getOlderCompanies = async ({ page = 1, limit = 10 }: IGetCompaniesParams): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const offset = (page - 1) * limit;

        const query = `
            WITH OrderedCompanies AS (
                SELECT 
                    tbc.id AS companyId,
                    tbc.company,
                    tba.currentBoxUsed,
                    tba.createAt,
                    tbsd.id AS idStatusData,
                    tbsd.status AS statusData,
                    tbsm.status AS statusModel,
                    ROW_NUMBER() OVER (PARTITION BY tbc.id ORDER BY tba.createAt DESC) AS rn
                FROM TB_Companies AS tbc  
                LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
                LEFT JOIN TB_AttributeData AS tba ON tba.idOrder = tbo.id
                LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
                LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
                WHERE tba.createAt < DATEADD(MONTH, -6, GETDATE())
            )
            SELECT 
                companyId AS id,
                company,
                currentBoxUsed,
                createAt,
                CASE 
                    WHEN idStatusData = 1 THEN 0
                    WHEN idStatusData = 2 THEN 50
                    WHEN idStatusData = 3 THEN 100
                    ELSE NULL
                END AS percentage,
                statusData,
                statusModel
            FROM OrderedCompanies
            WHERE rn = 1
            ORDER BY createAt DESC
            OFFSET ${offset} ROWS
            FETCH NEXT ${limit} ROWS ONLY;
        `;

        const countQuery = `
            WITH OrderedCompanies AS (
                SELECT 
                    tbc.id AS companyId,
                    ROW_NUMBER() OVER (PARTITION BY tbc.id ORDER BY tba.createAt DESC) AS rn
                FROM TB_Companies AS tbc  
                LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
                LEFT JOIN TB_AttributeData AS tba ON tba.idOrder = tbo.id
                LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
                LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
                WHERE tba.createAt < DATEADD(MONTH, -6, GETDATE())
            )
            SELECT COUNT(*) AS total FROM OrderedCompanies WHERE rn = 1;
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
            WITH OrderedCompanies AS (
                SELECT 
                    tbc.id AS companyId,
                    tbc.company,
                    tbo.createAt,
                    tbsd.id AS idStatusData,
                    tbsd.status AS statusData,
                    tbsm.status AS statusModel,
                    ROW_NUMBER() OVER (PARTITION BY tbc.id ORDER BY tbo.createAt DESC) AS rn
                FROM TB_Companies AS tbc 
                LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
                LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
                LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
                WHERE tbsm.id != 2 AND tbsd.id != 1 AND tbo.createAt > DATEADD(MONTH, -6, GETDATE())
            )
            SELECT 
                companyId AS id,
                company,
                createAt,
                CASE 
                    WHEN idStatusData = 1 THEN 0
                    WHEN idStatusData = 2 THEN 50
                    WHEN idStatusData = 3 THEN 100
                    ELSE NULL
                END AS percentage,
                statusData,
                statusModel
            FROM OrderedCompanies
            WHERE rn = 1
            ORDER BY createAt DESC
            OFFSET ${offset} ROWS
            FETCH NEXT ${limit} ROWS ONLY;
        `;

        const countQuery = `
            WITH OrderedCompanies AS (
                SELECT 
                    tbc.id AS companyId,
                    ROW_NUMBER() OVER (PARTITION BY tbc.id ORDER BY tbo.createAt DESC) AS rn
                FROM TB_Companies AS tbc 
                LEFT JOIN TB_Order AS tbo ON tbo.idCompany = tbc.id
                LEFT JOIN TB_StatusData AS tbsd ON tbsd.id = tbo.idStatusData
                LEFT JOIN TB_StatusModel AS tbsm ON tbsm.id = tbo.idStatusModel
                WHERE tbsm.id != 2 AND tbsd.id != 1 AND tbo.createAt > DATEADD(MONTH, -6, GETDATE())
            )
            SELECT COUNT(*) AS total FROM OrderedCompanies WHERE rn = 1;
        `;

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

export const getCompaniesById = async (data: { id: number }): Promise<IresponseRepositoryService> => {
    try {
        const id = data.id;

        const db = await connectToSqlServer();

        const checkQuery = `SELECT COUNT(*) as total FROM TB_Companies WHERE id = @id`;
        const checkResult = await db?.request()
            .input('id', id)
            .query(checkQuery);

        if (!checkResult || checkResult.recordset[0].total === 0) {
            return {
                code: 404,
                message: { translationKey: "company.emptyResponse", translationParams: { name: "getCompaniesById" } },
            };
        }

        const query = `SELECT * FROM TB_Companies WHERE id = @id`;
        const result = await db?.request()
            .input('id', id)
            .query(query);

        const company = result?.recordset;

        if (company && company.length > 0) {
            return {
                code: 200,
                message: { translationKey: "company.successful", translationParams: { name: "getCompaniesById" } },
                data: company
            };
        } else {
            return {
                code: 204,
                message: { translationKey: "company.emptyResponse", translationParams: { name: "getCompaniesById" } }
            };
        }

    } catch (err) {
        console.error("Error fetching company by ID:", err);
        return {
            code: 400,
            message: { translationKey: "companies.error_server", translationParams: { name: "getCompaniesById" } },
        };
    }
};

export const getDataFilesCompaniesById = async (data: { id: number }): Promise<IresponseRepositoryService> => {
    try {
        const companyId = data.id;
        const db = await connectToSqlServer();

        const checkQuery = `SELECT COUNT(*) as total FROM TB_Companies WHERE id = @id`;
        const checkResult = await db?.request()
            .input('id', companyId)
            .query(checkQuery);

        if (!checkResult || checkResult.recordset[0].total === 0) {
            return {
                code: 404,
                message: { translationKey: "company.emptyResponse", translationParams: { name: "getDataFilesCompaniesById" } },
            };
        }

        const query = `
            SELECT 
                tbo.id AS orderId,
                nf.uploadedAt AS uploadDateTime,
                FORMAT(nf.uploadedAt, 'MMMM d') + 
                CASE 
                    WHEN DAY(nf.uploadedAt) IN (11,12,13) THEN 'th'
                    WHEN RIGHT(CAST(DAY(nf.uploadedAt) AS VARCHAR), 1) = '1' THEN 'st'
                    WHEN RIGHT(CAST(DAY(nf.uploadedAt) AS VARCHAR), 1) = '2' THEN 'nd'
                    WHEN RIGHT(CAST(DAY(nf.uploadedAt) AS VARCHAR), 1) = '3' THEN 'rd'
                    ELSE 'th'
                END AS uploadDate,
                nf.fileName,
                nf.fileType
            FROM TB_Companies c
            LEFT JOIN TB_Order tbo ON tbo.idCompany = c.id
            INNER JOIN TB_NameFile nf ON nf.idOrder = tbo.id
            WHERE c.id = @id
            ORDER BY nf.uploadedAt DESC;
        `;

        const result = await db?.request()
            .input('id', companyId)
            .query(query);

        const files = result?.recordset;

        if (files && files.length > 0) {
            return {
                code: 200,
                message: { translationKey: "company.successful", translationParams: { name: "getDataFilesCompaniesById" } },
                data: files
            };
        } else {
            return {
                code: 204,
                message: { translationKey: "company.emptyResponse", translationParams: { name: "getDataFilesCompaniesById" } }
            };
        }

    } catch (err) {
        console.error("Error fetching company file data by ID:", err);
        return {
            code: 400,
            message: { translationKey: "company.error_server", translationParams: { name: "getDataFilesCompaniesById" } },
        };
    }
};

export const getCompanyFileDetailsByDate = async (data: { id: number, fileType: string | "Box Kit File" | "Shipment Data File", uploadDate: string, page?: number, limit?: number }): Promise<IresponseRepositoryService> => {
    try {
        const { id, fileType, uploadDate, page = 1, limit = 10 } = data;
        const db = await connectToSqlServer();
        const offset = (page - 1) * limit;

        let query = "";
        let countQuery = "";

        if (fileType === "Box Kit File") {
            query = `
                SELECT bkf.*
                FROM TB_Companies c
                LEFT JOIN TB_Order tbo ON tbo.idCompany = c.id
                LEFT JOIN TB_BoxKitFile bkf ON bkf.idOrder = tbo.id
                WHERE c.id = @id AND CAST(bkf.createAt AS DATE) = @uploadDate
                ORDER BY bkf.createAt DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
            `;

            countQuery = `
                SELECT COUNT(*) AS total
                FROM TB_Companies c
                LEFT JOIN TB_Order tbo ON tbo.idCompany = c.id
                LEFT JOIN TB_BoxKitFile bkf ON bkf.idOrder = tbo.id
                WHERE c.id = @id AND CAST(bkf.createAt AS DATE) = @uploadDate;
            `;
        } else if (fileType === "Shipment Data File") {
            query = `
                SELECT sdf.*
                FROM TB_Companies c
                LEFT JOIN TB_Order tbo ON tbo.idCompany = c.id
                LEFT JOIN TB_ShipmentDataFile sdf ON sdf.idOrder = tbo.id
                WHERE c.id = @id AND CAST(sdf.createAt AS DATE) = @uploadDate
                ORDER BY sdf.createAt DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
            `;

            countQuery = `
                SELECT COUNT(*) AS total
                FROM TB_Companies c
                LEFT JOIN TB_Order tbo ON tbo.idCompany = c.id
                LEFT JOIN TB_ShipmentDataFile sdf ON sdf.idOrder = tbo.id
                WHERE c.id = @id AND CAST(sdf.createAt AS DATE) = @uploadDate;
            `;
        } else {
            return {
                code: 400,
                message: { translationKey: "company.invalid_file_type", translationParams: { name: "getCompanyFileDetailsByDate" } },
            };
        }

        const [dataResult, countResult] = await Promise.all([
            db?.request()
                .input('id', id)
                .input('uploadDate', uploadDate)
                .input('offset', offset)
                .input('limit', limit)
                .query(query),
            db?.request()
                .input('id', id)
                .input('uploadDate', uploadDate)
                .query(countQuery)
        ]);

        const dataFound = dataResult?.recordset || [];
        const total = countResult?.recordset[0]?.total || 0;

        if (dataFound.length > 0) {
            return {
                code: 200,
                message: { translationKey: "company.successful", translationParams: { name: "getCompanyFileDetailsByDate" } },
                data: {
                    results: dataFound,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            };
        } else {
            return {
                code: 204,
                message: { translationKey: "company.emptyResponse", translationParams: { name: "getCompanyFileDetailsByDate" } }
            };
        }

    } catch (error) {
        console.error("Error getting specific company file data:", error);
        return {
            code: 400,
            message: { translationKey: "company.error_server", translationParams: { name: "getCompanyFileDetailsByDate" } }
        };
    }
};

export const deleteFileCompany = async (data: { id: number, fileType: string | "Box Kit File" | "Shipment Data File" }): Promise<IresponseRepositoryService> => {
  try {
    const { id, fileType } = data;
    const db = await connectToSqlServer();

    const resultsExist: any = await db?.request()
      .input("idOrder", id)
      .query(`
        SELECT TOP 1 id
        FROM TB_Results
        WHERE idOrder = @idOrder
      `);

    if (resultsExist.recordset.length > 0) {
      return {
        code: 400,
        message: {
          translationKey: "This data already has results. It cannot be deleted.",
          translationParams: { name: "deleteFileCompany" }
        },
      };
    }

    let query = "";

    if (fileType === "Box Kit File") {
      query = `DELETE FROM TB_BoxKitFile WHERE idOrder = @id`;
    } else if (fileType === "Shipment Data File") {
      query = `DELETE FROM TB_ShipmentDataFile WHERE idOrder = @id`;
    } else {
      return {
        code: 400,
        message: { translationKey: "company.invalid_file_type", translationParams: { name: "deleteFileCompany" } },
      };
    }

    const result = await db?.request()
      .input('id', id)
      .query(query);

    const rowsAffected = result?.rowsAffected?.[0] || 0;

    if (rowsAffected > 0) {
      return {
        code: 200,
        message: { translationKey: "company.successful", translationParams: { name: "deleteFileCompany" } },
      };
    } else {
      return {
        code: 404,
        message: { translationKey: "company.notFound", translationParams: { name: "deleteFileCompany" } },
      };
    }

  } catch (err) {
    console.error("Error deleting file company:", err);
    return {
      code: 400,
      message: { translationKey: "company.error_server", translationParams: { name: "deleteFileCompany" } },
    };
  }
};

const createOrder = async (db: any, idCompany: number): Promise<number> => {
    const insertOrderQuery = `
        INSERT INTO TB_Order (idCompany, idStatusData, idStatusModel, createAt)
        OUTPUT INSERTED.id
        VALUES (@idCompany, @idStatusData, @idStatusModel, GETDATE())
    `;

    const insertOrderResult = await db.request()
        .input('idCompany', idCompany)
        .input('idStatusData', 1)
        .input('idStatusModel', 1)
        .query(insertOrderQuery);

    const idOrder = insertOrderResult?.recordset?.[0]?.id;

    if (!idOrder) {
        throw new Error("Could not retrieve the ID of the created order.");
    }

    return idOrder;
};

export const createAttributeData = async (data: ICompany): Promise<IresponseRepositoryService> => {
    try {
        const db = await connectToSqlServer();
        const { idOrder, idCompany } = data;

        await createAttributeDataInternal(db, data, idOrder, idCompany);

        return {
            code: 200,
            message: { translationKey: "attributeData.created", translationParams: { name: "createAttributeData" } },
        };
    } catch (error) {
        console.error("Error en createAttributeData repository:", error);
        return {
            code: 400,
            message: { translationKey: "attributeData.error_creating", translationParams: { name: "createAttributeData" } },
        };
    }
};

export const createAttributeDataInternal  = async (db: any, data: ICompany, idOrder?: number, idCompany?: number): Promise<void> => {
    if (!idOrder && idCompany) {
        const insertOrderQuery = `
            INSERT INTO TB_Order (idCompany, idStatusData, idStatusModel, createAt)
            OUTPUT INSERTED.id
            VALUES (@idCompany, @idStatusData, @idStatusModel, GETDATE())
        `;

        const insertOrderResult = await db.request()
            .input('idCompany', idCompany)
            .input('idStatusData', 1)
            .input('idStatusModel', 1)
            .query(insertOrderQuery);

        idOrder = insertOrderResult?.recordset?.[0]?.id;

        if (!idOrder) {
            throw new Error("Could not retrieve the ID of the created order within createAttributeData.");
        }
    }

    if (!idOrder) {
        throw new Error("idOrder or idCompany is required to create the attribute data.");
    }

    const {
        currentBoxUsed, runCurrentBoxKitOnly, minimunNumBox, maximunNumBox, orderUsed,
        weightDataAvailable, idWeightData, idBoxDimension, assignedBoxes,
        itemClearanceRuleUsed, clearanceAmount, multipleItemsPreCubed, idFreightChargeMethod,
        dimWeightFactor, idPackMaterial, packMaterialCost, corrugateType,
        corrugateCost, freightCostPerLb
    } = data;

    const insertAttribetDataQuery = `INSERT INTO TB_AttributeData (
        currentBoxUsed, runCurrentBoxKitOnly,
        minimunNumBox, maximunNumBox, orderUsed, weightDataAvailable, idWeightData, idBoxDimension, assignedBoxes,
        itemClearanceRuleUsed, clearanceAmount, multipleItemsPreCubed, idFreightChargeMethod,
        dimWeightFactor, idPackMaterial, packMaterialCost, corrugateType, corrugateCost, freightCostPerLb, idOrder, createAt
    ) OUTPUT INSERTED.* VALUES (
        @currentBoxUsed, @runCurrentBoxKitOnly,
        @minimunNumBox, @maximunNumBox, @orderUsed, @weightDataAvailable, @idWeightData, @idBoxDimension, @assignedBoxes,
        @itemClearanceRuleUsed, @clearanceAmount, @multipleItemsPreCubed, @idFreightChargeMethod,
        @dimWeightFactor, @idPackMaterial, @packMaterialCost, @corrugateType, @corrugateCost, @freightCostPerLb, @idOrder, GETDATE()
    )`;

    await db.request()
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
        .input('idOrder', idOrder)
        .query(insertAttribetDataQuery);
};