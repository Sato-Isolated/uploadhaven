"use client";

import { useState, useEffect } from "react";
import { Activity, Server, HardDrive, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  performance: {
    totalMetrics: number;
    recentMetrics: number;
    cryptoOperations: number;
    uploads: number;
  };
  memory: {
    usedJSSize: number;
    totalJSSize: number;
    jsHeapSizeLimit: number;
    usagePercentage: number;
  } | null;
  uptime: number;
}

interface MaintenanceResult {
  success: boolean;
  action: string;
  result: unknown;
  timestamp: string;
}

export function AdminDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);

  // Fetch health data
  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/maintenance');
      if (!response.ok) {
        throw new Error('Failed to fetch health data');
      }
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Run maintenance task
  const runMaintenance = async (action: string) => {
    setMaintenanceLoading(true);
    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-maintenance-key' // In production, use proper auth
        },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error('Maintenance task failed');
      }

      const result: MaintenanceResult = await response.json();
      setLastCleanup(result.timestamp);
      
      // Refresh health data
      await fetchHealthData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Maintenance failed');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Auto-refresh health data
  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number | undefined) => {
    if (!bytes || isNaN(bytes)) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchHealthData();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Server className="w-6 h-6" />
          System Dashboard
        </h2>

        {/* System Status */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">Status</span>
            </div>
            <p className="text-green-600 dark:text-green-400 capitalize">{healthData?.status}</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">Uptime</span>
            </div>
            <p className="text-blue-600 dark:text-blue-400">
              {healthData?.uptime ? formatUptime(healthData.uptime) : 'N/A'}
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">Recent Metrics</span>
            </div>
            <p className="text-purple-600 dark:text-purple-400">
              {healthData?.performance.recentMetrics || 0}
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="font-medium text-orange-800 dark:text-orange-200">Memory Usage</span>
            </div>
            <p className="text-orange-600 dark:text-orange-400">
              {healthData?.memory ? `${healthData.memory.usagePercentage.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Metrics Collected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {healthData?.performance.totalMetrics || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Crypto Operations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {healthData?.performance.cryptoOperations || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">File Uploads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {healthData?.performance.uploads || 0}
              </p>
            </div>
            {healthData?.memory && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Memory Used</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatBytes(healthData.memory.usedJSSize || 0)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Actions */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Maintenance</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => runMaintenance('cleanup')}
              disabled={maintenanceLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {maintenanceLoading ? 'Running...' : 'Run Cleanup'}
            </button>
            <button
              onClick={() => runMaintenance('performance-stats')}
              disabled={maintenanceLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Get Performance Stats
            </button>
            <button
              onClick={fetchHealthData}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          {lastCleanup && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last cleanup: {new Date(lastCleanup).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
