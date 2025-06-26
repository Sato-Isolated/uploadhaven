/**
 * Maintenance scheduler for automatic cleanup and monitoring
 */

import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { MongoShareRepository } from '@/infrastructure/database/mongo-share-repository';
import { DiskStorageService } from '@/infrastructure/storage/disk-storage-service';
import { serverPerformanceMonitor } from '@/lib/performance/server-performance-monitor';

export class MaintenanceScheduler {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(
    private cleanupIntervalMs: number = 6 * 60 * 60 * 1000, // 6 hours
    private monitoringIntervalMs: number = 5 * 60 * 1000 // 5 minutes
  ) {}

  start() {
    console.log('Starting maintenance scheduler...');
    
    // Schedule cleanup task
    this.cleanupInterval = setInterval(() => {
      this.performCleanup().catch(console.error);
    }, this.cleanupIntervalMs);

    // Schedule monitoring task
    this.monitoringInterval = setInterval(() => {
      this.performMonitoring().catch(console.error);
    }, this.monitoringIntervalMs);

    // Run initial cleanup
    this.performCleanup().catch(console.error);
    
    console.log(`Maintenance scheduled: cleanup every ${this.cleanupIntervalMs / 1000 / 60 / 60}h, monitoring every ${this.monitoringIntervalMs / 1000 / 60}min`);
  }

  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('Maintenance scheduler stopped');
  }

  async performCleanup(): Promise<void> {
    try {
      console.log('Starting scheduled cleanup...');
      
      const fileRepository = new MongoFileRepository();
      const shareRepository = new MongoShareRepository();
      const storageService = new DiskStorageService();

      // Perform cleanup in parallel
      const results = await Promise.allSettled([
        fileRepository.cleanup(),
        shareRepository.cleanup(),
        storageService.cleanup()
      ]);

      // Log results
      results.forEach((result, index) => {
        const services = ['file repository', 'share repository', 'storage service'];
        if (result.status === 'fulfilled') {
          console.log(`✓ ${services[index]} cleanup completed`);
        } else {
          console.error(`✗ ${services[index]} cleanup failed:`, result.reason);
        }
      });

      console.log('Scheduled cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  async performMonitoring(): Promise<void> {
    try {
      const summary = serverPerformanceMonitor.getSummary();
      const memoryUsage = serverPerformanceMonitor.getMemoryUsage();

      // Log performance metrics
      console.log('Performance monitoring:', {
        totalMetrics: summary.totalMetrics,
        recentMetrics: summary.recentMetrics,
        cryptoOperations: summary.cryptoOperations,
        uploads: summary.uploads,
        apiOperations: summary.apiOperations,
        dbOperations: summary.dbOperations,
        averageResponseTime: Math.round(summary.averageResponseTime * 100) / 100,
        memoryUsage: memoryUsage ? Math.round(memoryUsage.usagePercentage * 100) / 100 : undefined
      });

      // Alert on high memory usage
      if (memoryUsage && memoryUsage.usagePercentage > 80) {
        console.warn(`⚠️  High memory usage: ${memoryUsage.usagePercentage.toFixed(1)}%`);
      }

      // Alert on slow API performance
      if (summary.averageResponseTime > 1000) {
        console.warn(`⚠️  Slow API performance: ${summary.averageResponseTime.toFixed(1)}ms average`);
      }

      // Alert on high recent activity
      if (summary.recentMetrics > 50) {
        console.warn(`⚠️  High server activity: ${summary.recentMetrics} operations in last minute`);
      }

    } catch (error) {
      console.error('Monitoring failed:', error);
    }
  }

  // Manual cleanup method
  async runCleanupNow(): Promise<void> {
    await this.performCleanup();
  }

  // Get current status
  getStatus() {
    return {
      isRunning: this.cleanupInterval !== null,
      cleanupInterval: this.cleanupIntervalMs,
      monitoringInterval: this.monitoringIntervalMs,
      nextCleanup: this.cleanupInterval ? new Date(Date.now() + this.cleanupIntervalMs) : null,
      nextMonitoring: this.monitoringInterval ? new Date(Date.now() + this.monitoringIntervalMs) : null
    };
  }
}

// Global instance
let maintenanceScheduler: MaintenanceScheduler | null = null;

export function startMaintenanceScheduler() {
  if (!maintenanceScheduler) {
    maintenanceScheduler = new MaintenanceScheduler();
    maintenanceScheduler.start();
  }
  return maintenanceScheduler;
}

export function stopMaintenanceScheduler() {
  if (maintenanceScheduler) {
    maintenanceScheduler.stop();
    maintenanceScheduler = null;
  }
}

export function getMaintenanceScheduler() {
  return maintenanceScheduler;
}
