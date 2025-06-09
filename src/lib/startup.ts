import { backgroundCleanupService } from "./background-cleanup";

/**
 * Initialize all background services when the server starts
 */
export async function initializeBackgroundServices(): Promise<void> {
  try {
    // Initialize background services

    // Start the background cleanup service
    await backgroundCleanupService.start();

    // Handle graceful shutdown
    const gracefulShutdown = () => {
      // Shutting down background services
      backgroundCleanupService.stop();
      process.exit(0);
    };

    // Listen for termination signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
    process.on("SIGUSR2", gracefulShutdown); // nodemon restart

    // Background services initialized successfully
  } catch (error) {
    // Failed to initialize background services
    throw error;
  }
}

/**
 * Get the status of background services
 */
export function getBackgroundServicesStatus() {
  return {
    cleanupService: {
      isRunning: backgroundCleanupService.isServiceRunning(),
    },
  };
}

/**
 * Manually trigger cleanup (useful for testing or admin operations)
 */
export async function triggerManualCleanup() {
  return await backgroundCleanupService.runCleanup();
}

/**
 * Check and delete a specific file if expired (instant deletion)
 */
export async function checkFileExpiration(fileId: string) {
  return await backgroundCleanupService.checkAndDeleteFile(fileId);
}

/**
 * Check for files that just expired and delete them immediately
 */
export async function triggerInstantExpiration() {
  return await backgroundCleanupService.checkForInstantExpiration();
}
