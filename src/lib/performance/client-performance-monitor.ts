/**
 * Client-side performance monitoring (browser-only)
 */

interface ClientMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface ClientPerformanceSummary {
  totalMetrics: number;
  recentMetrics: number;
  cryptoOperations: number;
  uploads: number;
  webVitals: number;
  longTasks: number;
  memoryUsage: {
    usedJSSize: number;
    totalJSSize: number;
    jsHeapSizeLimit: number;
    usagePercentage: number;
  } | null;
}

class ClientPerformanceMonitor {
  private metrics: ClientMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private readonly maxMetrics = 100; // Keep fewer metrics in browser

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    try {
      // Core Web Vitals observer
      const vitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: entry.name,
            value: (entry as PerformanceEntry & { value?: number }).value || entry.duration || entry.startTime,
            timestamp: Date.now(),
            metadata: {
              type: 'web-vital',
              entryType: entry.entryType,
            },
          });
        }
      });

      vitalsObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
      this.observers.push(vitalsObserver);

      // Long task observer
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'long-task',
            value: entry.duration,
            timestamp: Date.now(),
            metadata: {
              type: 'performance',
              startTime: entry.startTime,
            },
          });
        }
      });

      if ('PerformanceObserver' in window && 'supportedEntryTypes' in PerformanceObserver) {
        if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
          longTaskObserver.observe({ entryTypes: ['longtask'] });
          this.observers.push(longTaskObserver);
        }
      }
    } catch (error) {
      console.warn('Client performance monitoring initialization failed:', error);
    }
  }

  recordMetric(metric: ClientMetric) {
    this.metrics.push(metric);
    
    // Keep only last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log critical performance issues
    if (metric.name === 'long-task' && metric.value > 100) {
      console.warn(`Long task detected: ${metric.value}ms`);
    }
  }

  // Measure crypto operations (client-side)
  async measureCryptoOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    if (typeof performance === 'undefined') {
      return operation();
    }

    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
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
      const duration = performance.now() - startTime;
      
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

  // Measure upload operations (client-side)
  async measureUpload<T>(operation: () => Promise<T>, fileSize: number): Promise<T> {
    if (typeof performance === 'undefined') {
      return operation();
    }

    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
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
      const duration = performance.now() - startTime;
      
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
  getSummary(): ClientPerformanceSummary {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000); // Last minute

    const cryptoOperations = recentMetrics.filter(m => m.metadata?.type === 'crypto-operation');
    const uploads = recentMetrics.filter(m => m.metadata?.type === 'upload');
    const webVitals = recentMetrics.filter(m => m.metadata?.type === 'web-vital');
    const longTasks = recentMetrics.filter(m => m.name === 'long-task');

    return {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      cryptoOperations: cryptoOperations.length,
      uploads: uploads.length,
      webVitals: webVitals.length,
      longTasks: longTasks.length,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  // Memory usage monitoring (browser)
  getMemoryUsage() {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      return null;
    }

    const memory = (performance as Performance & { 
      memory?: {
        usedJSSize: number;
        totalJSSize: number;
        jsHeapSizeLimit: number;
      }
    }).memory;
    
    if (!memory) {
      return null;
    }
    
    return {
      usedJSSize: memory.usedJSSize,
      totalJSSize: memory.totalJSSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSSize / memory.jsHeapSizeLimit) * 100,
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

  // Cleanup
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Only create instance in browser
export const clientPerformanceMonitor = typeof window !== 'undefined' 
  ? new ClientPerformanceMonitor() 
  : null;
