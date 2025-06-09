/**
 * Next.js Instrumentation
 * This file runs when the server starts up and is perfect for initializing background services
 */

export async function register() {  // Only run on the server side
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // Dynamic import to avoid loading on the client
      const { initializeBackgroundServices } = await import("@/lib/startup");      // Server starting - initializing background services
      await initializeBackgroundServices();
      // Background services initialized successfully
    } catch {
      // Failed to initialize background services
      // Don't crash the server if background services fail to start
      // They can be started manually later via the API
    }
  }
}
