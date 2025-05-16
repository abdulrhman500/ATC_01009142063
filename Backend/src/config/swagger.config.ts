import swaggerJsdoc from 'swagger-jsdoc';

// Environment variables will be loaded by dotenv in main.ts or bootstrap.ts
// This file will just consume them from process.env

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || '3000';
const API_ROOT_PATH = process.env.API_ROOT_PATH || '/api/v1'; // Ensure this matches your InversifyExpressServer rootPath

const serverUrl = `http://${HOST}:${PORT}${API_ROOT_PATH}`;

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: process.env.API_TITLE || 'Eventora API',
            version: process.env.API_VERSION || '1.0.0',
            description: process.env.API_DESCRIPTION || 'API documentation for the Eventora backend application.',
        },
        servers: [
            {
                url: serverUrl, // Dynamically set from environment variables
                description: process.env.API_SERVER_DESCRIPTION || 'Development server',
            },
            // You could add other servers here (e.g., staging, production)
            // by defining more environment variables.
        ],
        components: {
            // Define global components like securitySchemes or common schemas here.
            // Your JSDoc annotations in DTOs for schemas will be picked up by the 'apis' paths.
            // Example:
            // securitySchemes: {
            //   bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            // },
        },
        // Example global security (if you have securitySchemes defined):
        // security: [{ bearerAuth: [] }],
    },
    // Paths to files containing OpenAPI definitions (JSDoc comments)
    apis: [
        './src/api/controllers/**/*.ts', // Path to your controller files
        './src/api/dtos/**/*.ts',       // Path to your DTO files
        // Add any other files that contain your @openapi JSDoc comments
    ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;