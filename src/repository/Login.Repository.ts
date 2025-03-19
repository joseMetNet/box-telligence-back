import axios, { AxiosError } from "axios";
import { IresponseRepositoryService, dataLogin } from "../interface/Login.Interface";
import { authenticateUser } from '../helpers/UserManagment.Helper';
import { connectToSqlServer } from "../DB/config";
import { generateJWT, parseJwt } from "../helpers/generateJWT";

export const loginUser = async (data: dataLogin): Promise<IresponseRepositoryService> => {
    try {
        const { email, password } = data;
        const db = await connectToSqlServer();

        const checkUserQuery = `
        SELECT * 
        FROM TB_Users 
        WHERE email = @Email
        `;

        const checkUserResult = await db?.request()
            .input('Email', email)
            .query(checkUserQuery);

        if (!checkUserResult?.recordset.length) {
            return {
                code: 404,
                message: { translationKey: "login.error_user_not_found" },
            };
        }

        const userManagementResponse = await authenticateUser(email, password);

        
        const user = `
            SELECT TOP 1 tbu.id, tbu.idAuth, tbu.identification, tbu.idRole, tbr.role, tbu.name, tbu.lastName, tbu.email
            FROM TB_Users AS tbu
            LEFT JOIN TB_Role AS tbr ON tbr.id = tbu.idRole 
            WHERE tbu.email = @email;
        `;

        const token = await generateJWT(user, '1h');
        const expiresIn = await parseJwt(token);
        const result = await db?.request()
            .input('email', email)
            .query(user);
        return {
            code: 200,
            message: { translationKey: "login.successful" },
            data: {
                "user": result?.recordset,
                token,
                expiresIn
            }
        }
    } catch (err) {
        if (axios.isAxiosError(err)) {
            const axiosError = err as AxiosError;
            if (axiosError.response?.status === 401) {
                return {
                    code: 401,
                    message: { translationKey: "login.error_invalid_credentials" },
                };
            }
        }
        console.log("Error al loguearse", err);
        return {
            code: 400,
            message: { translationKey: "login.error_server" },
        };
    }
}
