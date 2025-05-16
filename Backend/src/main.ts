import "reflect-metadata";
import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config();
import http from 'http'; 
import { container } from "@config/inversify.config";
import { configureApplication } from '@src/server.setup';
import { setupGracefulShutdown } from '@config/gracefulShutdown';


const PORT = process.env.PORT || '3000';
const API_ROOT_PATH = process.env.API_ROOT_PATH || '/api/v1';
const HOST = process.env.HOST || 'localhost';

const app = configureApplication(container, API_ROOT_PATH);

// exporting app for testing purposes 
export { app };

const httpServer: http.Server = app.listen(Number(PORT), HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    if (API_ROOT_PATH && API_ROOT_PATH !== '/') {
        console.log(`   API version root available at http://${HOST}:${PORT}${API_ROOT_PATH}`);
    }
    console.log(`📚 Swagger API docs available at http://${HOST}:${PORT}/api-docs`);
});

setupGracefulShutdown(httpServer);