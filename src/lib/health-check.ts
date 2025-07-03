/**
 * Système de health checks pour monitoring de l'application
 */

import { getDb } from '../infrastructure/database/mongodb';
import { logger } from './logger';
import { ConfigurationService } from '../domains/shared/configuration';
import * as os from 'os';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  component: string;
  message?: string;
  timestamp: Date;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface SystemHealthReport {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  totalResponseTime: number;
  checks: HealthCheckResult[];
  version: string;
  uptime: number;
}

export abstract class HealthCheck {
  abstract name: string;
  abstract timeout: number;

  async execute(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        this.check(),
        this.timeoutPromise()
      ]);
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: result.status,
        component: this.name,
        message: result.message,
        timestamp: new Date(),
        responseTime,
        details: result.details
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        component: this.name,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        responseTime,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }

  protected abstract check(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    message?: string;
    details?: Record<string, any>;
  }>;

  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timeout after ${this.timeout}ms`));
      }, this.timeout);
    });
  }
}

/**
 * Health check pour la base de données MongoDB
 */
export class DatabaseHealthCheck extends HealthCheck {
  name = 'database';
  timeout = 5000;

  protected async check() {
    try {
      const db = await getDb();
      const adminDb = db.admin();
      
      // Test simple de ping
      const result = await adminDb.ping();
      
      if (result.ok === 1) {
        // Vérification supplémentaire : compter les collections
        const collections = await db.listCollections().toArray();
        
        return {
          status: 'healthy' as const,
          message: 'Database connection is healthy',
          details: {
            ping: result,
            collectionsCount: collections.length,
            collections: collections.map(c => c.name)
          }
        };
      } else {
        return {
          status: 'unhealthy' as const,
          message: 'Database ping failed',
          details: { ping: result }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: 'Database connection failed',
        details: { error: error instanceof Error ? error.message : error }
      };
    }
  }
}

/**
 * Health check pour le système de fichiers/stockage
 */
export class StorageHealthCheck extends HealthCheck {
  name = 'storage';
  timeout = 3000;

  constructor(private storagePath: string = './storage') {
    super();
  }

  protected async check() {
    try {
      const fs = await import('fs/promises');
      
      // Test d'écriture/lecture
      const testFile = `${this.storagePath}/.health-check-${Date.now()}`;
      const testContent = 'health-check-test';
      
      await fs.writeFile(testFile, testContent, 'utf8');
      const readContent = await fs.readFile(testFile, 'utf8');
      await fs.unlink(testFile);
      
      if (readContent === testContent) {
        // Vérification de l'espace disque
        const stats = await fs.stat(this.storagePath);
        
        return {
          status: 'healthy' as const,
          message: 'Storage is accessible',
          details: {
            path: this.storagePath,
            readable: true,
            writable: true,
            stats: {
              isDirectory: stats.isDirectory(),
              created: stats.birthtime,
              modified: stats.mtime
            }
          }
        };
      } else {
        return {
          status: 'unhealthy' as const,
          message: 'Storage read/write test failed'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: 'Storage access failed',
        details: { error: error instanceof Error ? error.message : error }
      };
    }
  }
}

/**
 * Health check pour la mémoire système
 */
export class MemoryHealthCheck extends HealthCheck {
  name = 'memory';
  timeout = 1000;

  constructor(
    private warningThreshold = 0.8, // 80%
    private criticalThreshold = 0.95, // 95%
    private osModule = os // Allow injection for testing
  ) {
    super();
  }

  protected async check() {
    const memUsage = process.memoryUsage();
    const totalMemory = this.osModule.totalmem();
    const freeMemory = this.osModule.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsageRatio = usedMemory / totalMemory;

    let status: 'healthy' | 'unhealthy' | 'degraded';
    let message: string;

    if (memoryUsageRatio > this.criticalThreshold) {
      status = 'unhealthy';
      message = `Critical memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`;
    } else if (memoryUsageRatio > this.warningThreshold) {
      status = 'degraded';
      message = `High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`;
    } else {
      status = 'healthy';
      message = `Memory usage normal: ${(memoryUsageRatio * 100).toFixed(1)}%`;
    }

    return {
      status,
      message,
      details: {
        process: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external
        },
        system: {
          total: totalMemory,
          free: freeMemory,
          used: usedMemory,
          usagePercent: (memoryUsageRatio * 100).toFixed(2)
        }
      }
    };
  }
}

/**
 * Health check pour la configuration
 */
export class ConfigurationHealthCheck extends HealthCheck {
  name = 'configuration';
  timeout = 1000;

  constructor(private configService: ConfigurationService) {
    super();
  }

  protected async check() {
    try {
      // Vérification que la configuration est valide
      const fileConfig = this.configService.getFileConfig();
      const shareConfig = this.configService.getShareConfig();
      const securityConfig = this.configService.getSecurityConfig();
      const storageConfig = this.configService.getStorageConfig();
      const features = this.configService.getFeatureFlags();

      // Vérifications basiques
      const issues: string[] = [];

      if (fileConfig.maxFileSize <= 0) {
        issues.push('Invalid maxFileSize');
      }

      if (fileConfig.allowedMimeTypes.length === 0) {
        issues.push('No allowed MIME types configured');
      }

      if (securityConfig.encryptionSettings.saltLength < 16) {
        issues.push('Salt length too short');
      }

      if (issues.length > 0) {
        return {
          status: 'unhealthy' as const,
          message: `Configuration issues: ${issues.join(', ')}`,
          details: { issues }
        };
      }

      return {
        status: 'healthy' as const,
        message: 'Configuration is valid',
        details: {
          features: Object.keys(features).filter(key => features[key as keyof typeof features]),
          fileConfig: {
            maxFileSize: fileConfig.maxFileSize,
            allowedMimeTypesCount: fileConfig.allowedMimeTypes.length,
            defaultExpirationHours: fileConfig.defaultExpirationHours
          },
          storageProvider: storageConfig.storageProvider
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: 'Configuration validation failed',
        details: { error: error instanceof Error ? error.message : error }
      };
    }
  }
}

/**
 * Gestionnaire principal des health checks
 */
export class HealthCheckManager {
  private checks: HealthCheck[] = [];
  private startTime = Date.now();

  constructor(private version: string = '1.0.0') {}

  addCheck(check: HealthCheck): void {
    this.checks.push(check);
  }

  async runAll(): Promise<SystemHealthReport> {
    const startTime = Date.now();
    
    logger.debug('Running health checks', { checksCount: this.checks.length });

    const results = await Promise.all(
      this.checks.map(check => check.execute())
    );

    const totalResponseTime = Date.now() - startTime;
    const uptime = Date.now() - this.startTime;

    // Déterminer le statut global
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    const unhealthyCount = results.filter(r => r.status === 'unhealthy').length;
    const degradedCount = results.filter(r => r.status === 'degraded').length;

    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }

    const report: SystemHealthReport = {
      status: overallStatus,
      timestamp: new Date(),
      totalResponseTime,
      checks: results,
      version: this.version,
      uptime
    };

    logger.info('Health check completed', {
      status: overallStatus,
      totalResponseTime,
      checksCount: results.length,
      unhealthyCount,
      degradedCount
    });

    return report;
  }

  async runSingle(componentName: string): Promise<HealthCheckResult | null> {
    const check = this.checks.find(c => c.name === componentName);
    if (!check) {
      return null;
    }

    return check.execute();
  }

  getRegisteredChecks(): string[] {
    return this.checks.map(c => c.name);
  }
}

/**
 * Factory pour créer un gestionnaire avec les checks par défaut
 */
export function createDefaultHealthCheckManager(
  configService: ConfigurationService,
  options: {
    version?: string;
    storagePath?: string;
    memoryWarningThreshold?: number;
    memoryCriticalThreshold?: number;
  } = {}
): HealthCheckManager {
  const manager = new HealthCheckManager(options.version);

  // Ajout des checks par défaut
  manager.addCheck(new DatabaseHealthCheck());
  manager.addCheck(new StorageHealthCheck(options.storagePath));
  manager.addCheck(new MemoryHealthCheck(
    options.memoryWarningThreshold,
    options.memoryCriticalThreshold
  ));
  manager.addCheck(new ConfigurationHealthCheck(configService));

  return manager;
}
