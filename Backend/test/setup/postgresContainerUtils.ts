import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';

// Store the container instance globally within this module so it can be stopped.
let container: StartedPostgreSqlContainer | null = null;

export async function startPostgresContainer(): Promise<StartedPostgreSqlContainer> {
    console.log('Attempting to start PostgreSQL container...');
    // You can customize the image, user, password, and database name if needed
    const pgContainer = await new PostgreSqlContainer('postgres:15-alpine') // Use a specific version
        // .withUsername('testuser') // Default is 'test'
        // .withPassword('testpassword') // Default is 'test'
        // .withDatabase('testdb') // Default is 'test'
        .withExposedPorts(5432)
        .withStartupTimeout(120000) // 2 minutes, default is 60s
        .start();

    container = pgContainer; // Store for stopping later
    console.log('PostgreSQL container started successfully.');
    console.log(`  Host: ${container.getHost()}`);
    console.log(`  Port: ${container.getPort()}`);
    console.log(`  Database: ${container.getDatabase()}`);
    console.log(`  Username: ${container.getUsername()}`);
    // Password is not directly gettable for security, but it's what you set or the default 'test'

    return container;
}

export function getDatabaseUrl(pgContainer: StartedPostgreSqlContainer): string {
    return `postgresql://${pgContainer.getUsername()}:${pgContainer.getPassword()}@${pgContainer.getHost()}:${pgContainer.getPort()}/${pgContainer.getDatabase()}`;
}

export function applyPrismaMigrations(databaseUrl: string): void {
    console.log(`Applying Prisma schema/migrations to: ${databaseUrl}`);
    try {
        // Define options for execSync, including the environment variables
        const execOptions = {
            env: {
                ...process.env, // Inherit existing environment variables (like PATH)
                DATABASE_URL: databaseUrl, // Set/Override DATABASE_URL specifically for this command
            },
            stdio: 'inherit' as 'inherit', // Pipe stdio to the console for visibility
        };

        // Execute the Prisma command without setting the env var directly in the command string
        execSync(`npx prisma migrate reset --force --skip-generate --skip-seed`, execOptions);

        console.log('✅ Prisma schema/migrations applied successfully.');
    } catch (error) {
        console.error('❌ Failed to apply Prisma schema/migrations:', error);
        throw error; // Re-throw to fail the setup if migrations don't apply
    }
}

export async function stopPostgresContainer(): Promise<void> {
    if (container) {
        console.log('Stopping PostgreSQL container...');
        await container.stop({ timeout: 10000 }); // Optional timeout for stop
        container = null;
        console.log('PostgreSQL container stopped.');
    }
}