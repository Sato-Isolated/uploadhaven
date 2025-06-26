/**
 * Unified performance monitoring interface
 */

import { serverPerformanceMonitor } from './server-performance-monitor';
import { clientPerformanceMonitor } from './client-performance-monitor';

interface UnifiedPerformanceSummary {
  totalMetrics: number;
  recentMetrics: number;
  cryptoOperations: number;
  uploads: number;
  longTasks: number;
  memoryUsage: {
    usedJSSize?: number;
    totalJSSize?: number;
    jsHeapSizeLimit?: number;
    heapUsed?: number;
    heapTotal?: number;
    external?: number;
    usagePercentage: number;
  } | null;
  // Server-specific metrics
  apiOperations?: number;
  dbOperations?: number;
  averageResponseTime?: number;
  // Client-specific metrics
  webVitals?: number;
  environment: 'server' | 'client';
}

class UnifiedPerformanceMonitor {
  // Determine which monitor to use based on environment
  private getActiveMonitor() {
    if (typeof window === 'undefined') {
      return { monitor: serverPerformanceMonitor, type: 'server' as const };
    } else {
      return { monitor: clientPerformanceMonitor, type: 'client' as const };
    }
  }

  // Measure crypto operations
  async measureCryptoOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const { monitor } = this.getActiveMonitor();
    
    if (!monitor) {
      return operation();
    }
    
    return monitor.measureCryptoOperation(name, operation);
  }

  // Measure upload operations
  async measureUpload<T>(operation: () => Promise<T>, fileSize: number): Promise<T> {
    const { monitor } = this.getActiveMonitor();
    
    if (!monitor) {
      return operation();
    }
    
    return monitor.measureUpload(operation, fileSize);
  }

  // Measure API operations (server-only)
  async measureApiOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const { monitor, type } = this.getActiveMonitor();
    
    if (type === 'server' && monitor && 'measureApiOperation' in monitor) {
      return monitor.measureApiOperation(name, operation);
    }
    
    return operation();
  }

  // Measure database operations (server-only)
  async measureDbOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const { monitor, type } = this.getActiveMonitor();
    
    if (type === 'server' && monitor && 'measureDbOperation' in monitor) {
      return monitor.measureDbOperation(name, operation);
    }
    
    return operation();
  }

  // Get unified performance summary
  getSummary(): UnifiedPerformanceSummary {
    const { monitor, type } = this.getActiveMonitor();
    
    if (!monitor) {
      return {
        totalMetrics: 0,
        recentMetrics: 0,
        cryptoOperations: 0,
        uploads: 0,
        longTasks: 0,
        memoryUsage: null,
        environment: type,
      };
    }

    const summary = monitor.getSummary();

    if (type === 'server') {
      // Server summary
      const serverSummary = summary as any;
      return {
        totalMetrics: serverSummary.totalMetrics,
        recentMetrics: serverSummary.recentMetrics,
        cryptoOperations: serverSummary.cryptoOperations,
        uploads: serverSummary.uploads,
        longTasks: 0, // Server doesn't track long tasks
        memoryUsage: serverSummary.memoryUsage ? {
          heapUsed: serverSummary.memoryUsage.heapUsed,
          heapTotal: serverSummary.memoryUsage.heapTotal,
          external: serverSummary.memoryUsage.external,
          usagePercentage: serverSummary.memoryUsage.usagePercentage,
        } : null,
        apiOperations: serverSummary.apiOperations,
        dbOperations: serverSummary.dbOperations,
        averageResponseTime: serverSummary.averageResponseTime,
        environment: 'server',
      };
    } else {
      // Client summary
      const clientSummary = summary as any;
      return {
        totalMetrics: clientSummary.totalMetrics,
        recentMetrics: clientSummary.recentMetrics,
        cryptoOperations: clientSummary.cryptoOperations,
        uploads: clientSummary.uploads,
        longTasks: clientSummary.longTasks,
        memoryUsage: clientSummary.memoryUsage ? {
          usedJSSize: clientSummary.memoryUsage.usedJSSize,
          totalJSSize: clientSummary.memoryUsage.totalJSSize,
          jsHeapSizeLimit: clientSummary.memoryUsage.jsHeapSizeLimit,
          usagePercentage: clientSummary.memoryUsage.usagePercentage,
        } : null,
        webVitals: clientSummary.webVitals,
        environment: 'client',
      };
    }
  }

  // Get memory usage
  getMemoryUsage() {
    const { monitor } = this.getActiveMonitor();
    return monitor?.getMemoryUsage() || null;
  }

  // Record metric directly
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>) {
    const { monitor } = this.getActiveMonitor();
    
    if (monitor && 'recordMetric' in monitor) {
      monitor.recordMetric({
        name,
        value,
        timestamp: Date.now(),
        metadata,
      });
    }
  }

  // Cleanup
  cleanup() {
    const { monitor, type } = this.getActiveMonitor();
    
    if (type === 'server' && monitor && 'cleanup' in monitor) {
      monitor.cleanup();
    } else if (type === 'client' && monitor && 'disconnect' in monitor) {
      monitor.disconnect();
    }
  }

  // Get environment info
  getEnvironment() {
    return this.getActiveMonitor().type;
  }
}

// Export unified monitor instance
export const performanceMonitor = new UnifiedPerformanceMonitor();

// Export individual monitors for specific use cases
export { serverPerformanceMonitor } from './server-performance-monitor';
export { clientPerformanceMonitor } from './client-performance-monitor';

// Export types
export type { UnifiedPerformanceSummary };
