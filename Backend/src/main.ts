import "reflect-metadata"; // Keep this at the very top
import 'module-alias/register';
import express from 'express';
import { InversifyExpressServer } from "inversify-express-utils";
import {container} from "./inversify.config";
import * as bodyParser from "body-parser";
import errorHandlerMiddleware from "./api/middleware/ErrorHandler.middleware";
// Import your controller files to ensure decorators are processed
import "@controllers/AuthController";

const port = 3000; // Or your desired port



const server = new InversifyExpressServer(container); // Pass the container instance

// Configure middleware using setConfig
server.setConfig((app) => {
    app.use(bodyParser.json()); // Middleware to parse JSON request bodies
    app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

    // Add any other global middleware here
    // app.use(cors());
    // app.use(helmet());
});

// Configure error handling middleware using setErrorConfig
server.setErrorConfig((app) => {
    app.use(errorHandlerMiddleware);
});

const app = server.build(); // Build the Express application

// Export app for testing purposes
export { app };

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});