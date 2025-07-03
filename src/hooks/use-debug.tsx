import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/performance';

interface DebugInfo {
  performance: {
    totalMetrics: number;
    recentMetrics: number;
    cryptoOperations: number;
    uploads: number;
    webVitals: number;
    longTasks: number;
  };
  memory: {
    usedJSSize: number;
    totalJSSize: number;
    jsHeapSizeLimit: number;
    usagePercentage: number;
  } | null;
  cache: {
    size: number;
  };
  isWebWorkerSupported: boolean;
  isOnline: boolean;
}

/**
 * Hook de debug pour les développeurs
 * Utilise les fonctions de monitoring non utilisées
 */
export function useDebug(enabled: boolean = process.env.NODE_ENV === 'development') {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    const updateDebugInfo = () => {
      try {
        const summary = performanceMonitor.getSummary();
        const memoryUsage = performanceMonitor.getMemoryUsage();
        
        setDebugInfo({
          performance: {
            totalMetrics: summary.totalMetrics,
            recentMetrics: summary.recentMetrics,
            cryptoOperations: summary.cryptoOperations,
            uploads: summary.uploads,
            webVitals: summary.webVitals || 0,
            longTasks: summary.longTasks,
          },
          memory: memoryUsage ? {
            usedJSSize: 'usedJSSize' in memoryUsage ? memoryUsage.usedJSSize : 0,
            totalJSSize: 'totalJSSize' in memoryUsage ? memoryUsage.totalJSSize : 0,
            jsHeapSizeLimit: 'jsHeapSizeLimit' in memoryUsage ? memoryUsage.jsHeapSizeLimit : 0,
            usagePercentage: memoryUsage.usagePercentage,
          } : null,
          cache: {
            size: 0 // Could add cache size here
          },
          isWebWorkerSupported: typeof Worker !== 'undefined',
          isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        });
      } catch (error) {
        console.warn('Debug info update failed:', error);
      }
    };

    // Update immediately
    updateDebugInfo();

    // Update every 5 seconds
    const interval = setInterval(updateDebugInfo, 5000);

    // Keyboard shortcut to toggle debug panel (Ctrl+Shift+D)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [enabled]);

  // Log performance warnings
  useEffect(() => {
    if (!enabled || !debugInfo) return;

    if (debugInfo.memory && debugInfo.memory.usagePercentage > 80) {
      console.warn(`🚨 High memory usage: ${debugInfo.memory.usagePercentage.toFixed(1)}%`);
    }

    if (debugInfo.performance.longTasks > 3) {
      console.warn(`🚨 Long tasks detected: ${debugInfo.performance.longTasks}`);
    }

    if (!debugInfo.isWebWorkerSupported) {
      console.warn('🚨 Web Workers not supported - crypto operations will block UI');
    }
  }, [debugInfo, enabled]);

  const DebugPanel = () => {
    if (!enabled || !isVisible) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">🔧 Debug Panel</span>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {debugInfo && (
          <div className="space-y-2">
            <div>
              <div className="text-green-400">Performance:</div>
              <div>• Metrics: {debugInfo.performance.totalMetrics}</div>
              <div>• Recent: {debugInfo.performance.recentMetrics}</div>
              <div>• Crypto ops: {debugInfo.performance.cryptoOperations}</div>
              <div>• Uploads: {debugInfo.performance.uploads}</div>
              <div>• Long tasks: {debugInfo.performance.longTasks}</div>
            </div>
            
            {debugInfo.memory && (
              <div>
                <div className="text-blue-400">Memory:</div>
                <div>• Usage: {debugInfo.memory.usagePercentage.toFixed(1)}%</div>
                <div>• Used: {(debugInfo.memory.usedJSSize / 1024 / 1024).toFixed(1)}MB</div>
              </div>
            )}
            
            <div>
              <div className="text-yellow-400">Features:</div>
              <div>• Web Workers: {debugInfo.isWebWorkerSupported ? '✅' : '❌'}</div>
              <div>• Online: {debugInfo.isOnline ? '✅' : '❌'}</div>
            </div>
          </div>
        )}
        
        <div className="mt-2 text-gray-400 text-xs">
          Press Ctrl+Shift+D to toggle
        </div>
      </div>
    );
  };

  return {
    debugInfo,
    isVisible,
    setIsVisible,
    DebugPanel,
    enabled
  };
}
