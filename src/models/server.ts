import config from "../config/config";
import { connectToSqlServer } from "../DB/config";
import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import "colors";
import i18n from "../config/i18n";
import fileUpload from 'express-fileupload';
import { swaggerDocs, swaggerUi } from '../helpers/swagger';
//routes
import loginRouter from "../routes/Login.Router";

class Server {
  private app: Application;
  private port: string;
  private path: any;

  constructor() {
    this.app = express();
    this.port = config.port || '8080';
    this.path = {
      // exmple
      example: "/boxtelligenceback",
    };

    // Conectar a bd
    this.conectarDB();
    // Middlwares
    this.middlewares();
    // Mis rutas
    this.routes();

    // cors proteger nuestra api para que solo reciba peticiones de cierto lugar
    // listas blancas y listas negras
  }

  async conectarDB() {
    // concection of bd
    await connectToSqlServer();
  }

  configurarCORS() {
    const corsOptions = {
        origin: process.env.URL_FRONT, 
        methods: ["GET", "POST", "PUT", "DELETE"], 
        allowedHeaders: ["Content-Type", "Authorization"], 
        optionsSuccessStatus: 200 
    };

    this.app.use(cors(corsOptions));
}

  middlewares() {
    // CORS
    this.app.use(cors());
    // Directorio publico
    this.app.use(express.static("public"));
    // resposes json
    this.app.use(express.json());
    // responses
    this.app.use(morgan("dev"));
    // subir archivos
    this.app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: "./tmp/",
        createParentPath: true,
      })
    );
    // translator handler 
    this.app.use(i18n.init);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  }

  routes() {
    // example
    this.app.use(this.path.example, loginRouter);
  }
  
  listen() {
    console.clear();
    this.app.listen(this.port, () => {
      console.log(` 🔥 Server in port ${this.port}`.bold);
    });
  }
}

export default Server;
