import { Sequelize } from "sequelize";
import "colors";
import config from "../config/config";
import * as sql from 'mssql';

const configSQL: sql.config = {
  user: config.user_server_sql,
  password: "boxt#123",
  database: config.name_database_sql,
  server:config.server_name_sql,
  requestTimeout: 180000,
  connectionTimeout: 30000,   // 30s para abrir conexión
  options: {
    encrypt: true,
    trustServerCertificate: false,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;
let connecting = false;

// Reconexión simple con backoff para ETIMEOUT de conexión
async function connectWithRetry(
  retries = 3,
  backoffMs = 1500
): Promise<sql.ConnectionPool> {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const p = new sql.ConnectionPool(configSQL);
      await p.connect();
      // Manejadores para errores del pool
      p.on('error', (err) => {
        console.error('[SQL POOL ERROR]', err);
        // invalida el pool para forzar refresh en próxima llamada
        pool = null;
      });
      return p;
    } catch (e) {
      lastError = e;
      console.warn(`[SQL CONNECT RETRY ${i + 1}/${retries}]`, (e as any)?.code || e);
      await new Promise((r) => setTimeout(r, backoffMs * (i + 1)));
    }
  }
  throw lastError;
}

export async function connectToSqlServer(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;
  if (connecting && pool) return pool; // ya hay un connect en curso

  try {
    connecting = true;
    pool = await connectWithRetry(3, 1500);
    console.log('Conectado a SQL Server');
    return pool;
  } catch (err) {
    console.error('Error al conectar a SQL Server:', err);
    // re-lanza para que el caller pueda responder 500
    throw err;
  } finally {
    connecting = false;
  }
}

// Helpers opcionales (te sirven con transacciones)
export async function safeRollback(tx: sql.Transaction) {
  try {
    await tx.rollback();
  } catch (e: any) {
    if (e?.code === 'EABORT' || e?.code === 'EALREADYROLLEDBACK') return;
    console.error('Error haciendo rollback:', e);
  }
}

export function logSqlError(e: any, ctx = '') {
  console.error(`SQL ERROR ${ctx} ::`, {
    message: e?.message,
    code: e?.code,
    number: e?.number,
    state: e?.state,
    class: e?.class,
    lineNumber: e?.lineNumber,
    serverName: e?.serverName,
    procName: e?.procName,
    precedingErrors: e?.precedingErrors,
  });
}
// Instancia de conexión para SQL
// async function connectToSqlServer() {
//   try {
//     const pool = await sql.connect(configSQL); // Utiliza la configuración de SQL
//     console.log('Conectado a SQL Server');

//     return pool;
//   } catch (err) {
//     console.error('Error al conectar a SQL Server:', err);
//   }
// }



//export { connectToSqlServer };
