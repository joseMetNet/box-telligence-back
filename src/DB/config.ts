import { Sequelize } from "sequelize";
import "colors";
import config from "../config/config";
import * as sql from 'mssql';

const configSQL: sql.config = {
  user: config.user_server_sql,
  password: "boxt#123",
  database: config.name_database_sql,
  server:config.server_name_sql,
  requestTimeout: 60000, 
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Instancia de conexión para SQL
async function connectToSqlServer() {
  try {
    const pool = await sql.connect(configSQL); // Utiliza la configuración de SQL
    console.log('Conectado a SQL Server');

    return pool;
  } catch (err) {
    console.error('Error al conectar a SQL Server:', err);
  }
}



export { connectToSqlServer };
