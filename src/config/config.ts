import dotEnv from "dotenv";
// utilizar variables de entorno
dotEnv.config();

export default {
    port: process.env.PORT  || "8080",
    server_name_sql: process.env.SERVER_NAME_SQL || "",
    user_server_sql: process.env.USER_SERVER_SQL || "",
    name_database_sql: process.env.NAME_DATABASE_SQL || ""
}