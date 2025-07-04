/**
 * API endpoint pour les health checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDefaultHealthCheckManager } from '../../../lib/health-check';
import { ConfigurationService, DEFAULT_CONFIGURATION } from '../../../domains/shared/configuration';
import { logger } from '../../../lib/logger';

// Instance du gestionnaire de health checks
let healthCheckManager: ReturnType<typeof createDefaultHealthCheckManager> | null = null;

function getHealthCheckManager() {
  if (!healthCheckManager) {
    const configService = new ConfigurationService(DEFAULT_CONFIGURATION);
    healthCheckManager = createDefaultHealthCheckManager(configService, {
      version: process.env.npm_package_version || '1.0.0',
      storagePath: process.env.STORAGE_PATH || './storage'
    });
  }
  return healthCheckManager;
}

/**
 * GET /api/health - Health check complet
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const component = searchParams.get('component');
  const format = searchParams.get('format') || 'json';

  try {
    const manager = getHealthCheckManager();

    let result;
    let statusCode = 200;

    if (component) {
      // Health check d'un composant spécifique
      result = await manager.runSingle(component);
      
      if (!result) {
        return NextResponse.json({
          error: 'Component not found',
          availableComponents: manager.getRegisteredChecks()
        }, { status: 404 });
      }

      // Déterminer le code de statut basé sur le résultat
      if (result.status === 'unhealthy') {
        statusCode = 503; // Service Unavailable
      } else if (result.status === 'degraded') {
        statusCode = 200; // OK mais avec warnings
      }
    } else {
      // Health check complet
      result = await manager.runAll();
      
      // Déterminer le code de statut basé sur le résultat global
      if (result.status === 'unhealthy') {
        statusCode = 503; // Service Unavailable
      } else if (result.status === 'degraded') {
        statusCode = 200; // OK mais avec warnings
      }
    }

    // Format de réponse
    if (format === 'text') {
      return new NextResponse(
        generateTextResponse(result),
        {
          status: statusCode,
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    }

    // Format JSON par défaut
    return NextResponse.json(result, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    logger.error('Health check failed', { error });

    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      details: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * HEAD /api/health - Health check simple (pour les load balancers)
 */
export async function HEAD(_request: NextRequest) {
  try {
    const manager = getHealthCheckManager();
    const result = await manager.runAll();

    const statusCode = result.status === 'unhealthy' ? 503 : 200;

    return new NextResponse(null, {
      status: statusCode,
      headers: {
        'X-Health-Status': result.status,
        'X-Health-Timestamp': result.timestamp.toISOString(),
        'X-Health-Response-Time': result.totalResponseTime.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    logger.error('Health check HEAD failed', { error });
    
    return new NextResponse(null, {
      status: 500,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Health-Error': 'system-failure'
      }
    });
  }
}

/**
 * Génère une réponse en format texte pour les outils de monitoring simples
 */
function generateTextResponse(result: any): string {
  if ('checks' in result) {
    // Rapport complet
    const lines = [
      `Status: ${String(result.status).toUpperCase()}`,
      `Timestamp: ${result.timestamp}`,
      `Response Time: ${result.totalResponseTime}ms`,
      `Uptime: ${Math.floor(Number(result.uptime) / 1000)}s`,
      `Version: ${result.version}`,
      '',
      'Components:'
    ];

    const checks = result.checks as Array<Record<string, unknown>>;
    for (const check of checks) {
      const status = String(check.status).toUpperCase().padEnd(9);
      const responseTime = check.responseTime ? `${check.responseTime}ms`.padStart(6) : '     -';
      lines.push(`  ${status} ${responseTime} ${check.component} - ${check.message || 'OK'}`);
    }

    return lines.join('\n');
  } else {
    // Check individuel
    return `${String(result.status).toUpperCase()} - ${result.component}: ${result.message || 'OK'} (${result.responseTime}ms)`;
  }
}
