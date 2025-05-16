import { stopPostgresContainer } from './postgresContainerUtils';

export default async (): Promise<void> => {
    console.log('\n💧 Jest Global Teardown: Stopping PostgreSQL Testcontainer...');
    try {
        await stopPostgresContainer();
        console.log('✅ Jest Global Teardown completed successfully.');
    } catch (error) {
        console.error('❌ Error during Jest Global Teardown:', error);
        process.exit(1);
    }
};