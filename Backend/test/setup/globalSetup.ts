import dotenv from 'dotenv';
import path from 'path';
import { startPostgresContainer, getDatabaseUrl, applyPrismaMigrations } from './postgresContainerUtils';

// Load any base test environment variables if needed (e.g., .env.test for other settings)
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

export default async (): Promise<void> => {
    console.log('\n🚀 Jest Global Setup: Starting PostgreSQL Testcontainer...');
    try {
        const postgresContainer = await startPostgresContainer();
        const databaseUrl = getDatabaseUrl(postgresContainer);

        // IMPORTANT: Set the DATABASE_URL environment variable so Prisma Client
        // and Prisma CLI commands use the testcontainer's database.
        process.env.DATABASE_URL = databaseUrl;
        console.log(` DATABASE_URL set for test run: ${databaseUrl}`);

        // Apply migrations/schema to the newly started container
        applyPrismaMigrations(databaseUrl);

        console.log('✅ Jest Global Setup completed successfully.');
    } catch (error) {
        console.error('❌ Error during Jest Global Setup:', error);
        // If setup fails, tests should not run.
        // We need to ensure container is stopped if it partially started.
        // await stopPostgresContainer(); // stopPostgresContainer might not have 'container' set if start failed early
        process.exit(1);
    }
};