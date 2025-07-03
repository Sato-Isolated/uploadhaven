"use client";

import { useState, useEffect } from "react";
import { Activity, Server, HardDrive, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { CryptoLoading, LaserScanLoading } from "@/components/ui/loading";
import { InfoTooltip, HelpTooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";

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
  
  // Toast hook
  const { addToast } = useToast();

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
      
      // Success toast
      addToast({
        type: "success",
        title: "Maintenance Complete",
        message: `${action} completed successfully`
      });
      
      // Refresh health data
      await fetchHealthData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Maintenance failed';
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Maintenance Failed",
        message: errorMessage
      });
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
      <div className="tactical-card p-8">
        <div className="text-center">
          <LaserScanLoading text="Scanning system status" className="mb-4" />
          <p className="text-muted-foreground">Retrieving dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tactical-card p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchHealthData();
            }}
            className="btn-tactical-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="tactical-card p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Server className="w-6 h-6 text-primary" />
          System Dashboard
        </h2>

        {/* System Status */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="tactical-card p-4 border-success group">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="font-medium text-success">Status</span>
              <InfoTooltip content="Current system operational status" />
            </div>
            <p className="text-success capitalize font-tactical">{healthData?.status}</p>
          </div>

          <div className="tactical-card p-4 border-primary group">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">Uptime</span>
              <InfoTooltip content="Time since the server was last restarted" />
            </div>
            <p className="text-primary font-tactical">
              {healthData?.uptime ? formatUptime(healthData.uptime) : 'N/A'}
            </p>
          </div>

          <div className="tactical-card p-4 border-warning group">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-warning" />
              <span className="font-medium text-warning">Recent Metrics</span>
              <InfoTooltip content="Performance metrics collected in the last period" />
            </div>
            <p className="text-warning font-tactical">
              {healthData?.performance.recentMetrics || 0}
            </p>
          </div>

          <div className="tactical-card p-4 border-destructive group">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-5 h-5 text-destructive" />
              <span className="font-medium text-destructive">Memory Usage</span>
              <InfoTooltip content="Percentage of JavaScript heap memory currently in use" />
            </div>
            <p className="text-destructive font-tactical">
              {healthData?.memory ? `${healthData.memory.usagePercentage.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="tactical-card p-4 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Metrics Collected</p>
              <p className="text-2xl font-bold text-foreground font-tactical">
                {healthData?.performance.totalMetrics || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Crypto Operations</p>
              <p className="text-2xl font-bold text-foreground font-tactical">
                {healthData?.performance.cryptoOperations || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">File Uploads</p>
              <p className="text-2xl font-bold text-foreground font-tactical">
                {healthData?.performance.uploads || 0}
              </p>
            </div>
            {healthData?.memory && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Memory Used</p>
                <p className="text-2xl font-bold text-foreground font-tactical">
                  {formatBytes(healthData.memory.usedJSSize || 0)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Actions */}
        <div className="tactical-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-foreground">Maintenance</h3>
            <HelpTooltip
              title="System Maintenance"
              description="Use these tools to perform system cleanup, gather performance statistics, and refresh dashboard data."
            />
          </div>
          
          {maintenanceLoading && (
            <div className="mb-4 text-center">
              <CryptoLoading stage="processing" className="mb-2" />
              <p className="text-xs text-muted-foreground">Running maintenance task...</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => runMaintenance('cleanup')}
              disabled={maintenanceLoading}
              className="btn-tactical px-4 py-2 disabled:opacity-50 border-destructive text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
            >
              {maintenanceLoading ? 'Running...' : 'Run Cleanup'}
            </button>
            <button
              onClick={() => runMaintenance('performance-stats')}
              disabled={maintenanceLoading}
              className="btn-tactical-primary px-4 py-2 disabled:opacity-50 transition-all duration-200"
            >
              Get Performance Stats
            </button>
            <button
              onClick={fetchHealthData}
              disabled={loading}
              className="btn-tactical px-4 py-2 disabled:opacity-50 border-success text-success hover:border-success hover:bg-success hover:text-success-foreground transition-all duration-200"
            >
              Refresh
            </button>
          </div>
          {lastCleanup && (
            <p className="text-sm text-muted-foreground font-tactical">
              Last cleanup: {new Date(lastCleanup).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
