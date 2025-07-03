/**
 * Server-side performance monitoring
 */

interface ServerMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface ServerPerformanceSummary {
  totalMetrics: number;
  recentMetrics: number;
  apiOperations: number;
  cryptoOperations: number;
  uploads: number;
  dbOperations: number;
  averageResponseTime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    usagePercentage: number;
  } | null;
}

class ServerPerformanceMonitor {
  private metrics: ServerMetric[] = [];
  private readonly maxMetrics = 1000; // Keep more metrics for server analysis

  recordMetric(metric: ServerMetric) {
    this.metrics.push(metric);
    
    // Keep only last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (metric.name.includes('api') && metric.value > 1000) {
      console.warn(`Slow API operation: ${metric.name} took ${metric.value}ms`);
    }
  }

  // Measure API operations
  async measureApiOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await operation();
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to ms
      
      this.recordMetric({
        name: `api-${name}`,
        value: duration,
        timestamp: Date.now(),
        metadata: {
          type: 'api-operation',
          success: true,
        },
      });
      
      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      this.recordMetric({
        name: `api-${name}`,
        value: duration,
        timestamp: Date.now(),
        metadata: {
          type: 'api-operation',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      
      throw error;
    }
  }

  // Measure crypto operations
  async measureCryptoOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await operation();
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      this.recordMetric({
        name: `crypto-${name}`,
        value: duration,
        timestamp: Date.now(),
        metadata: {
          type: 'crypto-operation',
          success: true,
        },
      });
      
      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      this.recordMetric({
        name: `crypto-${name}`,
        value: duration,
        timestamp: Date.now(),
        metadata: {
          type: 'crypto-operation',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      
      throw error;
    }
  }

  // Measure database operations
  async measureDbOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await operation();
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      this.recordMetric({
        name: `db-${name}`,
        value: duration,
        timestamp: Date.now(),
        metadata: {
          type: 'db-operation',
          success: true,
        },
      });
      
      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      this.recordMetric({
        name: `db-${name}`,
        value: duration,
        timestamp: Date.now(),
        metadata: {
          type: 'db-operation',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      
      throw error;
    }
  }

  // Measure upload operations
  async measureUpload<T>(operation: () => Promise<T>, fileSize: number): Promise<T> {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await operation();
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      const throughput = fileSize / (duration / 1000); // bytes per second
      
      this.recordMetric({
        name: 'file-upload',
        value: duration,
        timestamp: Date.now(),
        metadata: {
          type: 'upload',
          fileSize,
          throughput,
          success: true,
        },
      });
      
      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      this.recordMetric({
        name: 'file-upload',
        value: duration,
        timestamp: Date.now(),
        metadata: {
          type: 'upload',
          fileSize,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      
      throw error;
    }
  }

  // Get performance summary
  getSummary(): ServerPerformanceSummary {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000); // Last minute

    const apiOperations = recentMetrics.filter(m => m.metadata?.type === 'api-operation');
    const cryptoOperations = recentMetrics.filter(m => m.metadata?.type === 'crypto-operation');
    const uploads = recentMetrics.filter(m => m.metadata?.type === 'upload');
    const dbOperations = recentMetrics.filter(m => m.metadata?.type === 'db-operation');

    // Calculate average response time
    const successfulApiOps = apiOperations.filter(m => m.metadata?.success === true);
    const averageResponseTime = successfulApiOps.length > 0
      ? successfulApiOps.reduce((sum, m) => sum + m.value, 0) / successfulApiOps.length
      : 0;

    return {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      apiOperations: apiOperations.length,
      cryptoOperations: cryptoOperations.length,
      uploads: uploads.length,
      dbOperations: dbOperations.length,
      averageResponseTime,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  // Memory usage monitoring for Node.js
  getMemoryUsage() {
    if (typeof process === 'undefined') {
      return null;
    }

    const memUsage = process.memoryUsage();
    
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      usagePercentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
    };
  }

  // Get metrics by type
  getMetricsByType(type: string, timeWindowMs = 300000) { // 5 minutes default
    const cutoff = Date.now() - timeWindowMs;
    return this.metrics.filter(m => 
      m.metadata?.type === type && 
      m.timestamp > cutoff
    );
  }

  // Clear old metrics
  cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // Keep 24 hours
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }
}

export const serverPerformanceMonitor = new ServerPerformanceMonitor();
