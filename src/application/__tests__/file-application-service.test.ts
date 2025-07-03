import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { FileApplicationService } from '../file-application-service';
import { FileRepository } from '../../domains/file/file-repository';
import { ShareRepository } from '../../domains/share/share-repository';
import { StorageService } from '../../domains/storage/storage-service';
import { CryptoService } from '../../domains/security/crypto-service';
import { ConfigurationService } from '../../domains/shared/configuration';
import { FileEntity } from '../../domains/file/file-entity';
import { ShareEntity } from '../../domains/share/share-entity';
import { UploadFileCommand, DownloadFileCommand, DeleteFileCommand, CommandFactory } from '../commands';
import { ErrorFactory, ErrorCode } from '../../domains/shared/errors';

// Mock des dépendances
const mockFileRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  delete: vi.fn(),
  incrementCount: vi.fn(),
  cleanup: vi.fn(),
} as unknown as FileRepository;

const mockShareRepository = {
  save: vi.fn(),
  findByFileId: vi.fn(),
  delete: vi.fn(),
  cleanup: vi.fn(),
} as unknown as ShareRepository;

const mockStorageService = {
  save: vi.fn(),
  read: vi.fn(),
  delete: vi.fn(),
  generatePath: vi.fn(),
  cleanup: vi.fn(),
} as unknown as StorageService;

const mockCryptoService = {
  encryptFile: vi.fn(),
  decryptFile: vi.fn(),
} as unknown as CryptoService;

const mockConfigService = {
  isFeatureEnabled: vi.fn(),
  getFileConfig: vi.fn(),
  getShareConfig: vi.fn(),
} as unknown as ConfigurationService;

describe('FileApplicationService', () => {
  let service: FileApplicationService;
  const baseUrl = 'https://example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configuration par défaut
    (mockConfigService.isFeatureEnabled as Mock).mockReturnValue(true);
    (mockConfigService.getFileConfig as Mock).mockReturnValue({
      maxFileSize: 100 * 1024 * 1024,
      allowedMimeTypes: ['image/*', 'text/*'],
      defaultExpirationHours: 24,
      maxExpirationHours: 168,
      minExpirationHours: 1,
      maxMaxDownloads: 100
    });

    service = new FileApplicationService(
      mockFileRepository,
      mockShareRepository,
      mockStorageService,
      mockCryptoService,
      mockConfigService,
      baseUrl
    );
  });

  describe('uploadFile', () => {
    const mockFile = {
      name: 'test.txt',
      type: 'text/plain',
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024))
    } as unknown as File;

    const uploadCommand = CommandFactory.uploadFile({
      file: mockFile,
      expirationHours: 24,
      maxDownloads: 5,
      password: 'test123',
      metadata: {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1'
      }
    });

    it('should upload file successfully', async () => {
      // Arrange
      const encryptionResult = {
        encryptedData: new ArrayBuffer(1024),
        iv: new Uint8Array(16),
        salt: new Uint8Array(32)
      };
      
      (mockCryptoService.encryptFile as Mock).mockResolvedValue(encryptionResult);
      (mockStorageService.generatePath as Mock).mockReturnValue('/storage/test-id');
      (mockStorageService.save as Mock).mockResolvedValue(undefined);
      (mockFileRepository.save as Mock).mockResolvedValue(undefined);
      (mockShareRepository.save as Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.uploadFile(uploadCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('fileId');
      expect(result.data).toHaveProperty('shareUrl');
      expect(result.data).toHaveProperty('expiresAt');
      
      expect(mockCryptoService.encryptFile).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        'test123'
      );
      expect(mockFileRepository.save).toHaveBeenCalled();
      expect(mockShareRepository.save).toHaveBeenCalled();
    });

    it('should fail when file sharing is disabled', async () => {
      // Arrange
      (mockConfigService.isFeatureEnabled as Mock).mockReturnValue(false);

      // Act
      const result = await service.uploadFile(uploadCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.FEATURE_DISABLED);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidCommand = CommandFactory.uploadFile({
        file: {
          ...mockFile,
          size: 200 * 1024 * 1024 // Trop gros
        } as File,
        expirationHours: 24
      });

      // Act
      const result = await service.uploadFile(invalidCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should handle encryption errors', async () => {
      // Arrange
      (mockCryptoService.encryptFile as Mock).mockRejectedValue(
        new Error('Encryption failed')
      );

      // Act
      const result = await service.uploadFile(uploadCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UPLOAD_FAILED');
    });
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      // Arrange
      const mockFileEntity = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        encryptedPath: '/storage/test-file',
        expirationHours: 24
      });
      
      const downloadCommand = CommandFactory.downloadFile({
        fileId: mockFileEntity.id,
        password: 'test123',
        metadata: {
          userAgent: 'test-agent',
          ipAddress: '127.0.0.1'
        }
      });

      const combinedData = new ArrayBuffer(1024);
      const decryptedData = new ArrayBuffer(512);

      (mockFileRepository.findById as Mock).mockResolvedValue(mockFileEntity);
      (mockStorageService.read as Mock).mockResolvedValue(combinedData);
      (mockCryptoService.decryptFile as Mock).mockResolvedValue(decryptedData);
      (mockFileRepository.incrementCount as Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.downloadFile(downloadCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('fileName', 'test.txt');
      expect(result.data).toHaveProperty('mimeType', 'text/plain');
      expect(result.data).toHaveProperty('content', decryptedData);
      
      expect(mockFileRepository.incrementCount).toHaveBeenCalledWith(mockFileEntity.id);
    });

    it('should fail when file not found', async () => {
      // Arrange
      const downloadCommand = CommandFactory.downloadFile({
        fileId: 'non-existent-id',
        password: 'test123',
        metadata: {
          userAgent: 'test-agent',
          ipAddress: '127.0.0.1'
        }
      });

      (mockFileRepository.findById as Mock).mockResolvedValue(null);

      // Act
      const result = await service.downloadFile(downloadCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.FILE_NOT_FOUND);
    });

    it('should fail when file is expired', async () => {
      // Arrange
      const expiredFile = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        encryptedPath: '/storage/test-file',
        expirationHours: -1 // Déjà expiré
      });

      const downloadCommand = CommandFactory.downloadFile({
        fileId: expiredFile.id,
        password: 'test123',
        metadata: {
          userAgent: 'test-agent',
          ipAddress: '127.0.0.1'
        }
      });

      (mockFileRepository.findById as Mock).mockResolvedValue(expiredFile);

      // Act
      const result = await service.downloadFile(downloadCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.FILE_EXPIRED);
    });

    it('should fail when max downloads reached', async () => {
      // Arrange
      const fileWithMaxDownloads = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        encryptedPath: '/storage/test-file',
        expirationHours: 24,
        maxDownloads: 1
      });

      // Simuler que le fichier a atteint sa limite
      const exhaustedFile = fileWithMaxDownloads.incrementDownloadCount();
      
      const downloadCommand = CommandFactory.downloadFile({
        fileId: exhaustedFile.id,
        password: 'test123',
        metadata: {
          userAgent: 'test-agent',
          ipAddress: '127.0.0.1'
        }
      });

      (mockFileRepository.findById as Mock).mockResolvedValue(exhaustedFile);

      // Act
      const result = await service.downloadFile(downloadCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(ErrorCode.FILE_MAX_DOWNLOADS_REACHED);
    });

    it('should handle decryption errors', async () => {
      // Arrange
      const mockFileEntity = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        encryptedPath: '/storage/test-file',
        expirationHours: 24
      });

      const downloadCommand = CommandFactory.downloadFile({
        fileId: mockFileEntity.id,
        password: 'test123',
        metadata: {
          userAgent: 'test-agent',
          ipAddress: '127.0.0.1'
        }
      });

      const combinedData = new ArrayBuffer(1024);

      (mockFileRepository.findById as Mock).mockResolvedValue(mockFileEntity);
      (mockStorageService.read as Mock).mockResolvedValue(combinedData);
      (mockCryptoService.decryptFile as Mock).mockRejectedValue(
        new Error('Decryption failed')
      );

      // Act
      const result = await service.downloadFile(downloadCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DOWNLOAD_FAILED');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      // Arrange
      const mockFileEntity = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        encryptedPath: '/storage/test-file',
        expirationHours: 24
      });

      const mockShareEntity = ShareEntity.create({
        fileId: mockFileEntity.id,
        baseUrl: 'https://example.com',
        expirationHours: 24,
        passwordProtected: false
      });

      const deleteCommand = CommandFactory.deleteFile({
        fileId: mockFileEntity.id,
        reason: 'manual',
        userId: 'admin'
      });

      (mockFileRepository.findById as Mock).mockResolvedValue(mockFileEntity);
      (mockShareRepository.findByFileId as Mock).mockResolvedValue(mockShareEntity);
      (mockStorageService.delete as Mock).mockResolvedValue(undefined);
      (mockShareRepository.delete as Mock).mockResolvedValue(undefined);
      (mockFileRepository.delete as Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.deleteFile(deleteCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(mockStorageService.delete).toHaveBeenCalledWith('/storage/test-file');
      expect(mockShareRepository.delete).toHaveBeenCalledWith(mockShareEntity.id);
      expect(mockFileRepository.delete).toHaveBeenCalledWith(mockFileEntity.id);
    });

    it('should fail when file not found', async () => {
      // Arrange
      const deleteCommand = CommandFactory.deleteFile({
        fileId: 'non-existent-id',
        reason: 'manual',
        userId: 'admin'
      });

      (mockFileRepository.findById as Mock).mockResolvedValue(null);

      // Act
      const result = await service.deleteFile(deleteCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_NOT_FOUND');
    });

    it('should continue deletion even if physical file deletion fails', async () => {
      // Arrange
      const mockFileEntity = FileEntity.create({
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        encryptedPath: '/storage/test-file',
        expirationHours: 24
      });

      const deleteCommand = CommandFactory.deleteFile({
        fileId: mockFileEntity.id,
        reason: 'manual',
        userId: 'admin'
      });

      (mockFileRepository.findById as Mock).mockResolvedValue(mockFileEntity);
      (mockShareRepository.findByFileId as Mock).mockResolvedValue(null);
      (mockStorageService.delete as Mock).mockRejectedValue(new Error('File not found'));
      (mockFileRepository.delete as Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.deleteFile(deleteCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(mockFileRepository.delete).toHaveBeenCalledWith(mockFileEntity.id);
    });
  });

  describe('cleanupExpiredFiles', () => {
    it('should cleanup expired files successfully', async () => {
      // Arrange
      (mockFileRepository.cleanup as Mock).mockResolvedValue(5);
      (mockShareRepository.cleanup as Mock).mockResolvedValue(3);
      (mockStorageService.cleanup as Mock).mockResolvedValue(undefined);

      // Act
      const result = await service.cleanupExpiredFiles();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.deletedCount).toBe(5);
      expect(mockFileRepository.cleanup).toHaveBeenCalled();
      expect(mockShareRepository.cleanup).toHaveBeenCalled();
      expect(mockStorageService.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup errors', async () => {
      // Arrange
      (mockFileRepository.cleanup as Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await service.cleanupExpiredFiles();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CLEANUP_FAILED');
    });
  });
});
