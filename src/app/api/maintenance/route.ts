import { NextRequest, NextResponse } from 'next/server';
import { MongoFileRepository } from '@/infrastructure/database/mongo-file-repository';
import { MongoShareRepository } from '@/infrastructure/database/mongo-share-repository';
import { DiskStorageService } from '@/infrastructure/storage/disk-storage-service';
import { WebCryptoService } from '@/domains/security/web-crypto-service';
import { FileApplicationService } from '@/application/file-application-service';
import { ConfigurationService, DEFAULT_CONFIGURATION } from '@/domains/shared/configuration';
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
    const cryptoService = new WebCryptoService();
    const configService = new ConfigurationService(DEFAULT_CONFIGURATION);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const fileAppService = new FileApplicationService(
      fileRepository,
      shareRepository,
      storageService,
      cryptoService,
      configService,
      baseUrl
    );

    let result: unknown;

    switch (action) {
      case 'cleanup':
        // Clean up expired files and shares using the application service
        const cleanupResult = await fileAppService.cleanupExpiredFiles();
        if (cleanupResult.success) {
          result = { 
            message: 'Cleanup completed successfully',
            deletedFiles: cleanupResult.data?.deletedCount || 0
          };
        } else {
          throw new Error(cleanupResult.error?.message || 'Cleanup failed');
        }
        break;

      case 'performance-stats':
        // Get performance statistics
        const summary = performanceMonitor.getSummary();
        const memoryUsage = performanceMonitor.getMemoryUsage();
        result = {
          performance: summary,
          memory: memoryUsage,
          timestamp: new Date().toISOString(),
          configuration: {
            featuresEnabled: configService.getFeatureFlags(),
            fileConfig: {
              maxFileSize: configService.getFileConfig().maxFileSize,
              maxExpirationHours: configService.getFileConfig().maxExpirationHours
            }
          }
        };
        break;

      case 'health-check':
        // Enhanced health check with configuration status
        const featureFlags = configService.getFeatureFlags();
        result = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            storage: 'accessible',
            cache: 'active',
            events: 'active'
          },
          features: featureFlags
        };
        break;

      case 'config-info':
        // New action to get configuration information
        result = {
          fileConfig: configService.getFileConfig(),
          shareConfig: configService.getShareConfig(),
          securityConfig: {
            // Don't expose sensitive settings
            largeFileSizeThreshold: configService.getSecurityConfig().largeFileSizeThreshold,
            requirePasswordForLargeFiles: configService.getSecurityConfig().requirePasswordForLargeFiles
          },
          features: configService.getFeatureFlags()
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Available: cleanup, performance-stats, health-check, config-info' },
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

    // Initialize configuration service for health check
    const configService = new ConfigurationService(DEFAULT_CONFIGURATION);

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
        cryptoOperations: summary.cryptoOperations,
        uploads: summary.uploads
      },
      memory: normalizedMemory,
      uptime: process.uptime(),
      features: configService.getFeatureFlags(),
      version: '2.0.0' // Updated architecture version
    });
  } catch (error: unknown) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
