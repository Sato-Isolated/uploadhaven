/**
 * Domain Dependency Injection Container
 * 
 * DDD-compliant DI container that wires real domain use cases with their dependencies.
 * Replaces placeholder implementations with actual domain logic.
 * 
 * @architecture DDD Dependency Injection
 * @pattern Dependency Injection Container
 * @privacy zero-knowledge - all use cases maintain privacy guarantees
 */

// Import actual domain use cases
import { UploadAnonymousUseCase, UploadAnonymousRequest, UploadAnonymousResponse } from '../../../domains/file-sharing/application/usecases/upload-anonymous.usecase';
import { DownloadFileUseCase, DownloadFileRequest, DownloadFileResponse } from '../../../domains/file-sharing/application/usecases/download-file.usecase';
import { LogSecurityEventUseCase, LogSecurityEventRequest, LogSecurityEventResponse } from '../../../domains/privacy/application/usecases/LogSecurityEvent.usecase';
import { LogAdminActionUseCase, LogAdminActionRequest, LogAdminActionResponse } from '../../../domains/admin/application/usecases/LogAdminAction.usecase';
import { RegisterUserUseCase, RegisterUserRequest, RegisterUserResponse } from '../../../domains/user-management/application/usecases/RegisterUser.usecase';
import { EncryptFileUseCase } from '../../../domains/encryption/application/usecases/encrypt-file.usecase';

// Import repository interfaces
import { IFileRepository } from '../../../domains/file-sharing/application/interfaces/file.repository.interface';
import { IUserRepository } from '../../../domains/user-management/domain/repositories/IUserRepository';
import { ISecurityEventRepository } from '../../../domains/privacy/domain/repositories/ISecurityEventRepository';
import { IAdminActionRepository } from '../../../domains/admin/domain/repositories/IAdminActionRepository';

// Import repository implementations
import { DiskFileRepository } from '../../../domains/file-sharing/infrastructure/database/disk-file.repository';
import { MongoUserRepository } from '../../../domains/user-management/infrastructure/database/mongo-user.repository';
import { MongoSecurityEventRepository } from '../../../domains/privacy/infrastructure/database/mongo-security-event.repository';
import { MongoAdminActionRepository } from '../../../domains/admin/infrastructure/database/mongo-admin-action.repository';

// Import services
import { EncryptionServiceAdapter } from '../../../domains/encryption/infrastructure/adapters/encryption-service.adapter';
import { PrivacySanitizer } from '../../../domains/privacy/infrastructure/sanitization/privacy-sanitizer.service';

// Import database connection
import { UnifiedDatabaseService } from '../database/unified-database.service';

/**
 * Domain Dependency Injection Container
 * 
 * Manages real domain use case instances with proper dependency injection.
 * Replaces placeholder implementations with actual domain logic.
 */
export class DomainContainer {
  private static instance: DomainContainer;

  // Repository instances
  private fileRepository!: IFileRepository;
  private userRepository!: IUserRepository;
  private securityEventRepository!: ISecurityEventRepository;
  private adminActionRepository!: IAdminActionRepository;
  // Service instances
  private encryptionService!: EncryptionServiceAdapter;
  private privacySanitizer!: PrivacySanitizer;

  // Use case instances
  private uploadAnonymousUseCase!: UploadAnonymousUseCase;
  private downloadFileUseCase!: DownloadFileUseCase;
  private logSecurityEventUseCase!: LogSecurityEventUseCase;
  private logAdminActionUseCase!: LogAdminActionUseCase;
  private registerUserUseCase!: RegisterUserUseCase;
  private encryptFileUseCase!: EncryptFileUseCase;

  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Initialize services synchronously first
    this.encryptionService = new EncryptionServiceAdapter();
    this.privacySanitizer = new PrivacySanitizer();
    
    // Initialize async components
    this.initializationPromise = this.initializeInfrastructure().then(() => {
      this.initializeUseCases();
      this.initialized = true;
    });
  }

  /**
   * Initialize infrastructure services and repositories
   */
  private async initializeInfrastructure(): Promise<void> {
    try {
      // Initialize unified database service
      const dbService = UnifiedDatabaseService.getInstance();
      await dbService.connect();      // Initialize repositories with proper database connections
      this.fileRepository = new DiskFileRepository();

      // Get native MongoDB connections for repositories that need them
      const nativeDb = await dbService.getNativeDb();
      const nativeClient = await dbService.getNativeClient();

      // Initialize repositories with correct constructor patterns      this.userRepository = new MongoUserRepository(nativeDb, 'users');
      this.securityEventRepository = new MongoSecurityEventRepository(nativeClient, 'uploadhaven');
      this.adminActionRepository = new MongoAdminActionRepository(nativeDb, 'admin_actions');

      // Services already initialized in constructor

      console.log('✅ Domain infrastructure initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize infrastructure:', error);
      throw new Error('Infrastructure initialization failed');
    }
  }
  /**
   * Initialize domain use cases with proper dependencies
   */
  private initializeUseCases(): void {
    try {
      // Get base URL from environment
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';      // Initialize file-sharing use cases with real encryption
      this.downloadFileUseCase = new DownloadFileUseCase(
        this.fileRepository
      );

      this.encryptFileUseCase = new EncryptFileUseCase(this.encryptionService);      this.uploadAnonymousUseCase = new UploadAnonymousUseCase(
        this.fileRepository,
        baseUrl
      );

      // Initialize other use cases with their repositories
      this.logSecurityEventUseCase = new LogSecurityEventUseCase(
        this.securityEventRepository,
        this.privacySanitizer
      );

      this.logAdminActionUseCase = new LogAdminActionUseCase(
        this.adminActionRepository
      );

      this.registerUserUseCase = new RegisterUserUseCase(
        this.userRepository
      );
    } catch (error) {
      console.error('❌ Failed to initialize use cases:', error);
      throw new Error('Use case initialization failed');
    }
  }

  static getInstance(): DomainContainer {
    if (!DomainContainer.instance) {
      DomainContainer.instance = new DomainContainer();
    }
    return DomainContainer.instance;
  }
  // Use Case Getters - Return actual domain use case instances
  getUploadAnonymousUseCase(): UploadAnonymousUseCase {
    return this.uploadAnonymousUseCase;
  }

  getDownloadFileUseCase(): DownloadFileUseCase {
    return this.downloadFileUseCase;
  }

  getLogSecurityEventUseCase(): LogSecurityEventUseCase {
    return this.logSecurityEventUseCase;
  }

  getLogAdminActionUseCase(): LogAdminActionUseCase {
    return this.logAdminActionUseCase;
  }

  getRegisterUserUseCase(): RegisterUserUseCase {
    return this.registerUserUseCase;
  }

  // Additional getters for repository access (if needed by services)
  getFileRepository(): IFileRepository {
    return this.fileRepository;
  }

  getUserRepository(): IUserRepository {
    return this.userRepository;
  }

  getSecurityEventRepository(): ISecurityEventRepository {
    return this.securityEventRepository;
  }

  getAdminActionRepository(): IAdminActionRepository {
    return this.adminActionRepository;
  }

  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
