import express, { Application } from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';
import { Container } from 'inversify';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// import swaggerUi from 'swagger-ui-express';
// import swaggerSpec from './config/swagger.config';
import errorHandlerMiddleware from './api/middleware/ErrorHandler.middleware';
import morgan from 'morgan';
// IMPORTANT: Import all your controllers here so InversifyJS can discover them.
import "@api/controllers/AuthController";
import "@api/controllers/CategoryController";
import "@api/controllers/EventController";
import "@api/controllers/VenueController";
import "@api/controllers/bookingController"

export function configureApplication(container: Container, rootPath: string): Application {
    const server = new InversifyExpressServer(container, null, { rootPath });

    // Configure application-level middleware
    server.setConfig((app) => {
        // Enable CORS for all routes and origins
        app.use(cors());

        app.use(morgan('dev'));
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());


        // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

        // app.use(cors());
        // app.use(helmet());
    });

    server.setErrorConfig((app) => {
        app.use(errorHandlerMiddleware);
    });

    return server.build();
}