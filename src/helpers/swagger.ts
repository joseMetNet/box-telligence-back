import swaggerJsDoc, { Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions: Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'box-telligence-back Backend',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:8080/boxtelligenceback',
                description: 'Local server',
            },
            {
                url: 'https://boxtelligenceback.azurewebsites.net/boxtelligenceback',
                description: 'Production server',
            },
        ],
        tags: [
            {
                name: 'Login',
                description: 'Operations related to login'
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export { swaggerDocs, swaggerUi };