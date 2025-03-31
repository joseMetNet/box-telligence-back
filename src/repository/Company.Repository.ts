import { connectToSqlServer } from "../DB/config";
import { ICompany, IresponseRepositoryService } from "../interface/Company.Interface";

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
        console.log(insertCompanyResult);
        return {
            code: 200,
            message: { translationKey: "company.created", translationParams: { name: "createCompany" } },
            data: insertCompanyResult?.recordset?.[0]
        }    
    } catch (err) {
        console.log("Error creating company", err);
        return {
            code: 400,
            message: { translationKey: "company.error_server", translationParams: { name: "createCompany" } },
        };
    }    
}