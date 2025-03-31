import { connectToSqlServer } from "../DB/config";
import { createUserInUserManagement } from "../helpers/UserManagment.Helper";
import { dataUser, IresponseRepositoryService } from "../interface/User.Interface";

export const createUser = async (data: dataUser): Promise<IresponseRepositoryService> => {
    try {
        const { identification, name, lastName, email, password } = data;
        const db = await connectToSqlServer();
        console.log(data);
        const idAuth = await createUserInUserManagement(email, password);
        console.log(idAuth);
        const insertUserQuery = `INSERT INTO TB_Users (identification, name, lastName, email, idRole, idAuth) 
        VALUES (@identification, @name, @lastName, @email, @idRole, @idAuth)`;

        const insertUserResult = await db?.request()
            .input('identification', identification)
            .input('name', name)
            .input('lastName', lastName)
            .input('email', email)
            .input('idRole', 1)
            .input('idAuth', idAuth)
            .query(insertUserQuery);

        return {
            code: 200,
            message: { translationKey: "user.created", translationParams: { name: "createUser" }},
            data: insertUserResult?.recordset
        }    
    } catch (err) {
        console.log("Error creating user", err);
        return {
            code: 400,
            message: { translationKey: "user.error_server", translationParams: { name: "createUser" } },
        };
    }

}