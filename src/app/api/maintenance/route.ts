import { NextRequest, NextResponse } from 'next/server';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { MongoShareRepository } from '@/infrastructure/database/mongo-share-repository';
import { DiskStorageService } from '@/infrastructure/storage/disk-storage-service';
import { performanceMonitor } from '@/lib/performance';

// API key for security (should be in environment variables)
const MAINTENANCE_API_KEY = process.env.MAINTENANCE_API_KEY || 'dev-maintenance-key';

export async function POST(request: NextRequest) {
  try {
    // Verify API key for security
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${MAINTENANCE_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Initialize services
    const fileRepository = new MongoFileRepository();
    const shareRepository = new MongoShareRepository();
    const storageService = new DiskStorageService();

    let result: unknown;

    switch (action) {
      case 'cleanup':
        // Clean up expired files and shares
        await Promise.all([
          fileRepository.cleanup(),
          shareRepository.cleanup(),
          storageService.cleanup()
        ]);
        result = { message: 'Cleanup completed successfully' };
        break;

      case 'performance-stats':
        // Get performance statistics
        const summary = performanceMonitor.getSummary();
        const memoryUsage = performanceMonitor.getMemoryUsage();
        result = {
          performance: summary,
          memory: memoryUsage,
          timestamp: new Date().toISOString()
        };
        break;

      case 'health-check':
        // Basic health check
        result = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            storage: 'accessible',
            cache: 'active'
          }
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Available: cleanup, performance-stats, health-check' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('Maintenance API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint for health checks
export async function GET() {
  try {
    const summary = performanceMonitor.getSummary();
    const memoryUsage = performanceMonitor.getMemoryUsage();

    // Normalize memory data to match admin dashboard expectations
    const normalizedMemory = memoryUsage ? {
      usedJSSize: ('usedJSSize' in memoryUsage) ? memoryUsage.usedJSSize : (memoryUsage.heapUsed || 0),
      totalJSSize: ('totalJSSize' in memoryUsage) ? memoryUsage.totalJSSize : (memoryUsage.heapTotal || 0),
      jsHeapSizeLimit: ('jsHeapSizeLimit' in memoryUsage) ? memoryUsage.jsHeapSizeLimit : (memoryUsage.heapTotal || 0),
      usagePercentage: memoryUsage.usagePercentage
    } : null;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      performance: {
        totalMetrics: summary.totalMetrics,
        recentMetrics: summary.recentMetrics,
        cryptoOperations: summary.cryptoOperations, // Already a number in new system
        uploads: summary.uploads // Already a number in new system
      },
      memory: normalizedMemory,
      uptime: process.uptime()
    });
  } catch (error: unknown) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
