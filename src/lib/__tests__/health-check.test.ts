import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  HealthCheck,
  HealthCheckManager,
  DatabaseHealthCheck,
  StorageHealthCheck,
  MemoryHealthCheck,
  ConfigurationHealthCheck,
  createDefaultHealthCheckManager
} from '../health-check';
import { ConfigurationService } from '../../domains/shared/configuration';

// Mock des dépendances
vi.mock('../../infrastructure/database/mongodb', () => ({
  getDb: vi.fn()
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  readFile: vi.fn(),
  unlink: vi.fn(),
  stat: vi.fn()
}));

vi.mock('../logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('os', () => ({
  totalmem: vi.fn(),
  freemem: vi.fn()
}));

describe('HealthCheck', () => {
  // Implementation d'un health check de test
  class TestHealthCheck extends HealthCheck {
    name = 'test';
    timeout = 1000;
    
    constructor(private mockResult: any) {
      super();
    }

    protected async check() {
      if (this.mockResult instanceof Error) {
        throw this.mockResult;
      }
      return this.mockResult;
    }
  }

  it('should execute successful health check', async () => {
    const healthCheck = new TestHealthCheck({
      status: 'healthy',
      message: 'All good'
    });

    const result = await healthCheck.execute();

    expect(result.status).toBe('healthy');
    expect(result.component).toBe('test');
    expect(result.message).toBe('All good');
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(typeof result.responseTime).toBe('number');
  });

  it('should handle health check errors', async () => {
    const healthCheck = new TestHealthCheck(new Error('Test error'));

    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.component).toBe('test');
    expect(result.message).toBe('Test error');
    expect(result.details?.error).toContain('Test error');
  });

  it('should handle health check timeout', async () => {
    class SlowHealthCheck extends HealthCheck {
      name = 'slow';
      timeout = 100;

      protected async check() {
        await new Promise(resolve => setTimeout(resolve, 200));
        return { status: 'healthy' as const };
      }
    }

    const healthCheck = new SlowHealthCheck();
    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('timeout');
  });
});

describe('DatabaseHealthCheck', () => {
  let mockGetDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Récupérer le mock depuis le module mocké
    const { getDb } = await import('../../infrastructure/database/mongodb');
    mockGetDb = getDb as any;
  });

  it('should pass when database is healthy', async () => {
    const mockDb = {
      admin: () => ({
        ping: vi.fn().mockResolvedValue({ ok: 1 })
      }),
      listCollections: () => ({
        toArray: vi.fn().mockResolvedValue([
          { name: 'files' },
          { name: 'shares' }
        ])
      })
    };

    mockGetDb.mockResolvedValue(mockDb as any);

    const healthCheck = new DatabaseHealthCheck();
    const result = await healthCheck.execute();

    expect(result.status).toBe('healthy');
    expect(result.details?.collectionsCount).toBe(2);
  });

  it('should fail when database ping fails', async () => {
    const mockDb = {
      admin: () => ({
        ping: vi.fn().mockResolvedValue({ ok: 0 })
      }),
      listCollections: () => ({
        toArray: vi.fn().mockResolvedValue([])
      })
    };

    mockGetDb.mockResolvedValue(mockDb as any);

    const healthCheck = new DatabaseHealthCheck();
    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('ping failed');
  });

  it('should fail when database connection fails', async () => {
    mockGetDb.mockRejectedValue(new Error('Connection failed'));

    const healthCheck = new DatabaseHealthCheck();
    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('connection failed');
  });
});

describe('StorageHealthCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass when storage is accessible', async () => {
    const mockFs = {
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('health-check-test'),
      unlink: vi.fn().mockResolvedValue(undefined),
      stat: vi.fn().mockResolvedValue({
        isDirectory: () => true,
        birthtime: new Date(),
        mtime: new Date()
      })
    };

    vi.doMock('fs/promises', () => mockFs);

    const healthCheck = new StorageHealthCheck('./test-storage');
    const result = await healthCheck.execute();

    expect(result.status).toBe('healthy');
    expect(result.details?.readable).toBe(true);
    expect(result.details?.writable).toBe(true);
  });

  it('should fail when read/write test fails', async () => {
    const mockFs = {
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue('wrong-content'),
      unlink: vi.fn().mockResolvedValue(undefined),
      stat: vi.fn()
    };

    vi.doMock('fs/promises', () => mockFs);

    const healthCheck = new StorageHealthCheck('./test-storage');
    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('read/write test failed');
  });

  it('should fail when storage access fails', async () => {
    const mockFs = {
      writeFile: vi.fn().mockRejectedValue(new Error('Permission denied')),
      readFile: vi.fn(),
      unlink: vi.fn(),
      stat: vi.fn()
    };

    vi.doMock('fs/promises', () => mockFs);

    const healthCheck = new StorageHealthCheck('./test-storage');
    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('access failed');
  });
});

describe('MemoryHealthCheck', () => {
  // Simplification : on va directement mocker le module 'os' au lieu de global.require
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should report healthy memory usage', async () => {
    // Mock de process.memoryUsage avec le bon typage
    const mockMemoryUsage = vi.fn().mockReturnValue({
      rss: 100 * 1024 * 1024,
      heapTotal: 50 * 1024 * 1024,
      heapUsed: 30 * 1024 * 1024,
      external: 5 * 1024 * 1024,
      arrayBuffers: 0
    }) as any;
    
    process.memoryUsage = mockMemoryUsage;

    // Mock du module 'os' directement
    vi.doMock('os', () => ({
      totalmem: () => 8 * 1024 * 1024 * 1024, // 8GB
      freemem: () => 6 * 1024 * 1024 * 1024   // 6GB free (25% used)
    }));

    const healthCheck = new MemoryHealthCheck();
    const result = await healthCheck.execute();

    expect(result.status).toBe('healthy');
    expect(result.message).toContain('normal');
  });

  it('should report degraded memory usage', async () => {
    const mockMemoryUsage = vi.fn().mockReturnValue({
      rss: 100 * 1024 * 1024,
      heapTotal: 50 * 1024 * 1024,
      heapUsed: 30 * 1024 * 1024,
      external: 5 * 1024 * 1024,
      arrayBuffers: 0
    }) as any;
    
    process.memoryUsage = mockMemoryUsage;

    // Mock OS module with dependency injection
    const mockOsModule = {
      totalmem: vi.fn().mockReturnValue(8 * 1024 * 1024 * 1024), // 8GB
      freemem: vi.fn().mockReturnValue(1 * 1024 * 1024 * 1024),  // 1GB free (87.5% used)
    } as any;

    const healthCheck = new MemoryHealthCheck(0.8, 0.95, mockOsModule);
    const result = await healthCheck.execute();

    expect(result.status).toBe('degraded');
    expect(result.message).toContain('High memory usage');
  });

  it('should report critical memory usage', async () => {
    const mockMemoryUsage = vi.fn().mockReturnValue({
      rss: 100 * 1024 * 1024,
      heapTotal: 50 * 1024 * 1024,
      heapUsed: 30 * 1024 * 1024,
      external: 5 * 1024 * 1024,
      arrayBuffers: 0
    }) as any;
    
    process.memoryUsage = mockMemoryUsage;

    // Mock OS module with dependency injection
    const mockOsModule = {
      totalmem: vi.fn().mockReturnValue(8 * 1024 * 1024 * 1024), // 8GB
      freemem: vi.fn().mockReturnValue(0.2 * 1024 * 1024 * 1024), // 0.2GB free (97.5% used)
    } as any;

    const healthCheck = new MemoryHealthCheck(0.8, 0.95, mockOsModule);
    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('Critical memory usage');
  });
});

describe('ConfigurationHealthCheck', () => {
  let mockConfigService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConfigService = {
      getFileConfig: vi.fn().mockReturnValue({
        maxFileSize: 100 * 1024 * 1024,
        allowedMimeTypes: ['image/*', 'text/*'],
        defaultExpirationHours: 24
      }),
      getShareConfig: vi.fn().mockReturnValue({}),
      getSecurityConfig: vi.fn().mockReturnValue({
        encryptionSettings: {
          saltLength: 32
        }
      }),
      getStorageConfig: vi.fn().mockReturnValue({
        storageProvider: 'disk'
      }),
      getFeatureFlags: vi.fn().mockReturnValue({
        fileSharing: true,
        passwordProtection: true
      })
    };
  });

  it('should pass when configuration is valid', async () => {
    const healthCheck = new ConfigurationHealthCheck(mockConfigService);
    const result = await healthCheck.execute();

    expect(result.status).toBe('healthy');
    expect(result.message).toBe('Configuration is valid');
  });

  it('should fail when maxFileSize is invalid', async () => {
    mockConfigService.getFileConfig.mockReturnValue({
      maxFileSize: 0,
      allowedMimeTypes: ['image/*'],
      defaultExpirationHours: 24
    });

    const healthCheck = new ConfigurationHealthCheck(mockConfigService);
    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('Invalid maxFileSize');
  });

  it('should fail when no MIME types are allowed', async () => {
    mockConfigService.getFileConfig.mockReturnValue({
      maxFileSize: 100 * 1024 * 1024,
      allowedMimeTypes: [],
      defaultExpirationHours: 24
    });

    const healthCheck = new ConfigurationHealthCheck(mockConfigService);
    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('No allowed MIME types');
  });

  it('should fail when salt length is too short', async () => {
    mockConfigService.getSecurityConfig.mockReturnValue({
      encryptionSettings: {
        saltLength: 8
      }
    });

    const healthCheck = new ConfigurationHealthCheck(mockConfigService);
    const result = await healthCheck.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.message).toContain('Salt length too short');
  });
});

describe('HealthCheckManager', () => {
  let manager: HealthCheckManager;

  beforeEach(() => {
    manager = new HealthCheckManager('1.0.0-test');
  });

  it('should run all health checks and return report', async () => {
    const healthyCheck = new (class extends HealthCheck {
      name = 'healthy';
      timeout = 1000;
      protected async check() {
        return { status: 'healthy' as const, message: 'OK' };
      }
    })();

    const degradedCheck = new (class extends HealthCheck {
      name = 'degraded';
      timeout = 1000;
      protected async check() {
        return { status: 'degraded' as const, message: 'Warning' };
      }
    })();

    manager.addCheck(healthyCheck);
    manager.addCheck(degradedCheck);

    const report = await manager.runAll();

    expect(report.status).toBe('degraded'); // Overall status
    expect(report.checks).toHaveLength(2);
    expect(report.version).toBe('1.0.0-test');
    expect(typeof report.totalResponseTime).toBe('number');
    expect(typeof report.uptime).toBe('number');
  });

  it('should run single health check', async () => {
    const testCheck = new (class extends HealthCheck {
      name = 'test';
      timeout = 1000;
      protected async check() {
        return { status: 'healthy' as const };
      }
    })();

    manager.addCheck(testCheck);

    const result = await manager.runSingle('test');

    expect(result).not.toBeNull();
    expect(result!.status).toBe('healthy');
    expect(result!.component).toBe('test');
  });

  it('should return null for non-existent component', async () => {
    const result = await manager.runSingle('non-existent');
    expect(result).toBeNull();
  });

  it('should return registered check names', () => {
    const testCheck = new (class extends HealthCheck {
      name = 'test';
      timeout = 1000;
      protected async check() {
        return { status: 'healthy' as const };
      }
    })();

    manager.addCheck(testCheck);

    const checks = manager.getRegisteredChecks();
    expect(checks).toEqual(['test']);
  });
});

describe('createDefaultHealthCheckManager', () => {
  let mockConfigService: ConfigurationService;

  beforeEach(() => {
    mockConfigService = {
      getFileConfig: vi.fn().mockReturnValue({
        maxFileSize: 100 * 1024 * 1024,
        allowedMimeTypes: ['image/*'],
        defaultExpirationHours: 24
      }),
      getShareConfig: vi.fn().mockReturnValue({}),
      getSecurityConfig: vi.fn().mockReturnValue({
        encryptionSettings: { saltLength: 32 }
      }),
      getStorageConfig: vi.fn().mockReturnValue({
        storageProvider: 'disk'
      }),
      getFeatureFlags: vi.fn().mockReturnValue({})
    } as any;
  });

  it('should create manager with default checks', () => {
    const manager = createDefaultHealthCheckManager(mockConfigService);
    
    const registeredChecks = manager.getRegisteredChecks();
    
    expect(registeredChecks).toContain('database');
    expect(registeredChecks).toContain('storage');
    expect(registeredChecks).toContain('memory');
    expect(registeredChecks).toContain('configuration');
  });

  it('should create manager with custom options', () => {
    const manager = createDefaultHealthCheckManager(mockConfigService, {
      version: '2.0.0',
      storagePath: '/custom/storage'
    });
    
    const registeredChecks = manager.getRegisteredChecks();
    expect(registeredChecks).toHaveLength(4);
  });
});
