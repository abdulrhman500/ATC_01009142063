import http from 'http';

let isShuttingDown = false;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 2000; // 10 seconds

/**
 * Performs the actual shutdown sequence.
 */
async function performShutdown(
    signal: string,
    httpServer: http.Server,
): Promise<void> {
    if (isShuttingDown) {
        console.log('🔴 Already attempting to shut down...');
        return;
    }
    isShuttingDown = true;
    console.log(`🔴 Received ${signal}. Gracefully shutting down server...`);

    // Set a timeout to force exit if graceful shutdown takes too long
    const timeoutId = setTimeout(() => {
        console.error('🔴 Graceful shutdown timed out after %dms. Forcing exit.', GRACEFUL_SHUTDOWN_TIMEOUT_MS);
        process.exit(1); // Exit with error code
    }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);

    // 1. Stop HTTP server from accepting new connections and wait for existing ones to finish
    httpServer.close(async (err) => {
        if (err) {
            console.error('❌ Error during HTTP server close:', err);
            // Even with an error here, we should proceed to close other resources
        } else {
            console.log('💤 HTTP server closed successfully.');
        }

        // 2. Close database connections

        // 3. Add any other cleanup tasks here (e.g., close message queue connections, release locks)
        console.log('🧹 All cleanup tasks finished.');

        clearTimeout(timeoutId); // Crucial: clear the forceful shutdown timeout as we are exiting gracefully
        console.log('👋 Exiting application now.');
        process.exit(err ? 1 : 0); // Exit with 0 for success, 1 if server.close() had an error
    });
}

/**
 * Sets up listeners for termination signals and unhandled errors to trigger graceful shutdown.
 * @param httpServer The HTTP server instance to close.
 * @param prismaClient The PrismaClient instance for disconnecting the database.
 */
export function setupGracefulShutdown(
    httpServer: http.Server,
): void {
    const shutdownHandler = (signal: string) => {
        performShutdown(signal, httpServer);
    };

    process.on('SIGINT', () => shutdownHandler('SIGINT'));  // Ctrl+C from terminal
    process.on('SIGTERM', () => shutdownHandler('SIGTERM')); // Sent by Docker, PM2, systemd, Kubernetes etc.

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason?.stack || reason);
        // For unhandled rejections, you might not always want to shut down,
        // but if it's critical, you could call shutdownHandler here too.
        // For now, just logging. Consider the implications for your app.
    });

    process.on('uncaughtException', (error: Error) => {
        console.error('💥 Uncaught Exception thrown:', error.stack || error);
        // An uncaught exception means the application is in an undefined, unstable state.
        // // It's critical to terminate. Attempt a graceful shutdown.
        // if (!isShuttingDown) { // Avoid re-triggering if shutdown is already in progress
        //     performShutdown('uncaughtException', httpServer, prismaClient);
        // }
        // Ensure process exits even if graceful shutdown hangs due to the error state
        // The timeout inside performShutdown should handle this, but as a final failsafe:
        setTimeout(() => process.exit(1), GRACEFUL_SHUTDOWN_TIMEOUT_MS + 2000).unref(); // Give it a bit more time than the main timeout
    });

    console.log('יים Graceful shutdown listeners configured.');
}