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
import userRouter from "../routes/User.Router";
import companyRouter from "../routes/Company.Router";
import boxDimensionRouter from "../routes/BoxDimension.Router";
import weightDataRouter from "../routes/WeightData.Router";
import packMaterialTypeRouter from "../routes/PackMaterialType.Router";
import freightChargeMethodRouter from "../routes/FreightChargeMethod.Router";
import boxkitFileRouter from "../routes/BoxKitFile.Router";
import shipmentDataFileRouter from "../routes/ShipmentDataFile.Router";
import attributeDataRouter from "../routes/AttributeData.Router";
import modelDataRouter from "../routes/ModelData.Router";
import evenDistributionModelRouter from "../routes/Results.Router";

class Server {
  private app: Application;
  private port: string;
  private path: any;

  constructor() {
    this.app = express();
    this.port = config.port || '8080';
    this.path = {
      // exmple
      url: "/boxtelligenceback",
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
    // this.app.use(
    //   fileUpload({
    //     limits: { fileSize: 5 * 1024 * 1024 },
    //     useTempFiles: true,
    //     tempFileDir: "./tmp/",
    //     createParentPath: true,
    //   })
    // );
    this.app.use(fileUpload({
      useTempFiles: false,  // Desactiva archivos temporales
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB de límite
      abortOnLimit: true,
      createParentPath: true
  }));
    // translator handler 
    this.app.use(i18n.init);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  }

  routes() {
    // example
    this.app.use(this.path.url, loginRouter);
    this.app.use(this.path.url, userRouter);
    this.app.use(this.path.url, companyRouter);
    this.app.use(this.path.url, boxDimensionRouter);
    this.app.use(this.path.url, weightDataRouter);
    this.app.use(this.path.url, packMaterialTypeRouter);
    this.app.use(this.path.url, freightChargeMethodRouter);
    this.app.use(this.path.url, boxkitFileRouter);
    this.app.use(this.path.url, shipmentDataFileRouter);
    this.app.use(this.path.url, attributeDataRouter);
    this.app.use(this.path.url, modelDataRouter);
    // this.app.use(this.path.url, attributeDataRouter);
    this.app.use(this.path.url, evenDistributionModelRouter);
  }
  
  listen() {
    console.clear();
    this.app.listen(this.port, () => {
      console.log(` 🔥 Server in port ${this.port}`.bold);
    });
  }
}

export default Server;
