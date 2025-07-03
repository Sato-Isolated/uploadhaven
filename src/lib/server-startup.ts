/**
 * Server startup initialization
 * This file handles server-side initialization tasks
 */

import { startMaintenanceScheduler } from './maintenance-scheduler';

let isInitialized = false;

export function initializeServer() {
  if (isInitialized) {
    return;
  }

  console.log('🚀 Initializing server...');

  try {
    // Start maintenance scheduler
    startMaintenanceScheduler();
    console.log('✅ Maintenance scheduler started');

    // Set initialization flag
    isInitialized = true;
    
    console.log('🎉 Server initialization completed');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
  }
}

// Initialize on module load (server-side only)
if (typeof window === 'undefined') {
  // Small delay to ensure all modules are loaded
  setTimeout(() => {
    initializeServer();
  }, 1000);
}

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, performing graceful shutdown...');
    // Import dynamically to avoid circular dependencies
    import('./maintenance-scheduler').then(({ stopMaintenanceScheduler }) => {
      stopMaintenanceScheduler();
      console.log('✅ Graceful shutdown completed');
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, performing graceful shutdown...');
    import('./maintenance-scheduler').then(({ stopMaintenanceScheduler }) => {
      stopMaintenanceScheduler();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    });
  });
}
