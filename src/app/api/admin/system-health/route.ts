import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { checkDBHealth } from '@/lib/database/mongodb';
import { createSuccessResponse, createErrorResponse, ERROR_CODES } from '@/lib/middleware';
import type { SystemHealth } from '@/types/admin';

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Authentication required');
    }

    // TODO: Add proper admin role check
    
    // Check database health
    const isDatabaseHealthy = await checkDBHealth();
    
    // Get system uptime
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeDays = Math.floor(uptimeHours / 24);
    const uptimeString = uptimeDays > 0 
      ? `${uptimeDays}d ${uptimeHours % 24}h`
      : `${uptimeHours}h ${Math.floor((uptime % 3600) / 60)}m`;

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);

    // Simulate other metrics (in a real app, these would come from system monitoring)
    const diskUsagePercent = Math.floor(Math.random() * 30) + 20; // 20-50%
    const cpuUsagePercent = Math.floor(Math.random() * 40) + 10; // 10-50%
    const networkLatency = Math.floor(Math.random() * 50) + 10; // 10-60ms

    // Determine overall status
    const criticalThreshold = 90;
    const warningThreshold = 75;
    
    const isCritical = memoryUsagePercent > criticalThreshold || 
                     diskUsagePercent > criticalThreshold || 
                     cpuUsagePercent > criticalThreshold ||
                     !isDatabaseHealthy;
    
    const isWarning = memoryUsagePercent > warningThreshold || 
                     diskUsagePercent > warningThreshold || 
                     cpuUsagePercent > warningThreshold;

    const status = isCritical ? 'critical' : isWarning ? 'warning' : 'healthy';

    const systemHealth: SystemHealth = {
      status,
      uptime: uptimeString,
      services: {
        database: isDatabaseHealthy ? 'online' : 'offline',
        storage: 'online', // TODO: Implement storage health check
        api: 'online', // If we're responding, API is online
        auth: 'online', // TODO: Implement auth service health check
      },
      metrics: {
        cpuUsage: cpuUsagePercent,
        memoryUsage: memoryUsagePercent,
        diskUsage: diskUsagePercent,
        networkLatency,
      },
    };

    return createSuccessResponse(systemHealth);
  } catch (error) {
    console.error('Error fetching system health:', error);
    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Failed to fetch system health');
  }
}
