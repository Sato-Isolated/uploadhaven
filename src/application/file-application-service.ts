/**
 * Service applicatif pour la gestion des fichiers avec validation, événements et configuration
 */

import { FileRepository } from '../domains/file/file-repository';
import { ShareRepository } from '../domains/share/share-repository';
import { StorageService } from '../domains/storage/storage-service';
import { CryptoService } from '../domains/security/crypto-service';
import { FileEntity } from '../domains/file/file-entity';
import { ShareEntity } from '../domains/share/share-entity';
import { ConfigurationService } from '../domains/shared/configuration';
import { eventBus, FileEvents, ShareEvents } from '../domains/shared/events';
import { FileUploadValidator, FilePasswordValidator } from '../domains/file/file-validators';
import { CompositeValidator } from '../domains/shared/validation';
import { 
  UploadFileCommand, 
  DownloadFileCommand, 
  DeleteFileCommand,
  CreateShareCommand,
  OperationResult 
} from './commands';
import { 
  FileUploadResult, 
  FileDownloadResult 
} from '../domains/file/file-value-objects';
import { 
  AppError, 
  ErrorCode, 
  ErrorFactory, 
  ErrorUtils 
} from '../domains/shared/errors';
import { logger } from '../lib/logger';

/**
 * Service applicatif pour les opérations sur les fichiers
 */
export class FileApplicationService {
  private uploadValidator: CompositeValidator<any>;
  private passwordValidator: FilePasswordValidator;

  constructor(
    private readonly fileRepository: FileRepository,
    private readonly shareRepository: ShareRepository,
    private readonly storageService: StorageService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigurationService,
    private readonly baseUrl: string
  ) {
    // Initialisation des validateurs
    this.uploadValidator = new CompositeValidator([
      new FileUploadValidator(this.configService.getFileConfig())
    ]);
    this.passwordValidator = new FilePasswordValidator();
  }

  /**
   * Upload un fichier avec validation complète et génération d'événements
   */
  async uploadFile(command: UploadFileCommand): Promise<OperationResult<FileUploadResult>> {
    try {
      const { payload } = command;
      
      // Vérification des feature flags
      if (!this.configService.isFeatureEnabled('fileSharing')) {
        throw ErrorFactory.featureDisabled('fileSharing');
      }

      // Validation de la requête
      const validationResult = this.uploadValidator.validate(payload);
      if (!validationResult.isValid) {
        throw ErrorFactory.validationError(validationResult.errors);
      }

      // Validation du mot de passe si fourni
      const passwordValidation = this.passwordValidator.validate(payload.password);
      if (!passwordValidation.isValid) {
        throw ErrorFactory.validationError(passwordValidation.errors);
      }

      // Conversion du fichier en ArrayBuffer
      const fileBuffer = await payload.file.arrayBuffer();
      
      // Chiffrement du fichier
      const encryptionResult = await this.cryptoService.encryptFile(fileBuffer, payload.password);
      
      // Génération de valeurs par défaut à partir de la configuration
      const fileConfig = this.configService.getFileConfig();
      const expirationHours = payload.expirationHours || fileConfig.defaultExpirationHours;
      const maxDownloads = payload.maxDownloads || fileConfig.defaultMaxDownloads;

      // Création de l'entité fichier
      const fileEntity = FileEntity.create({
        originalName: payload.file.name,
        mimeType: payload.file.type,
        size: payload.file.size,
        encryptedPath: '', // Sera défini après le stockage
        expirationHours,
        maxDownloads,
        passwordHash: payload.password ? await this.hashPassword(payload.password) : undefined,
        userId: payload.metadata?.userId // Associer le fichier à l'utilisateur connecté
      });

      // Génération du chemin de stockage et sauvegarde
      const storagePath = this.storageService.generatePath(fileEntity.id);
      const combinedData = this.combineEncryptedData(
        encryptionResult.encryptedData,
        encryptionResult.iv,
        encryptionResult.salt
      );
      
      await this.storageService.save(combinedData, storagePath);
      
      // Mise à jour de l'entité avec le chemin de stockage
      const updatedFileEntity = fileEntity.updateEncryptedPath(storagePath);
      
      // Sauvegarde en base de données
      await this.fileRepository.save(updatedFileEntity);

      // Création du partage si la fonctionnalité est activée
      let shareEntity: ShareEntity | null = null;
      if (this.configService.isFeatureEnabled('fileSharing')) {
        const shareConfig = this.configService.getShareConfig();
        shareEntity = ShareEntity.create({
          fileId: updatedFileEntity.id,
          baseUrl: this.baseUrl,
          expirationHours,
          maxAccess: shareConfig.defaultMaxAccess,
          passwordProtected: !!payload.password,
          passwordHash: updatedFileEntity.passwordHash,
          userId: payload.metadata?.userId // Associer le partage à l'utilisateur connecté
        });
        
        await this.shareRepository.save(shareEntity);
      }

      // Génération des événements
      await eventBus.publish(FileEvents.fileUploaded(updatedFileEntity.id, {
        fileName: updatedFileEntity.originalName,
        fileSize: updatedFileEntity.size,
        mimeType: updatedFileEntity.mimeType,
        encrypted: true,
        expiresAt: updatedFileEntity.expiresAt
      }));

      if (shareEntity) {
        await eventBus.publish(ShareEvents.shareCreated(shareEntity.id, {
          fileId: shareEntity.fileId,
          shareUrl: shareEntity.shareUrl,
          expiresAt: shareEntity.expiresAt,
          passwordProtected: shareEntity.passwordProtected
        }));
      }

      logger.info('File uploaded successfully', {
        fileId: updatedFileEntity.id,
        fileName: updatedFileEntity.originalName,
        size: updatedFileEntity.size,
        userAgent: payload.metadata?.userAgent,
        ipAddress: payload.metadata?.ipAddress
      });

      const result: FileUploadResult = {
        fileId: updatedFileEntity.id,
        shareUrl: shareEntity?.shareUrl || '',
        expiresAt: updatedFileEntity.expiresAt
      };

      return this.createSuccessResult(result);

    } catch (error) {
      const errorDetails = ErrorUtils.extractErrorDetails(error);
      logger.error('Failed to upload file', { ...errorDetails, command });
      
      if (ErrorUtils.isAppError(error)) {
        return {
          success: false,
          error: error.toJSON()
        };
      }
      
      return this.createErrorResult('UPLOAD_FAILED', 'Failed to upload file', errorDetails);
    }
  }

  /**
   * Télécharge un fichier avec validation et génération d'événements
   */
  async downloadFile(command: DownloadFileCommand): Promise<OperationResult<FileDownloadResult>> {
    try {
      const { payload } = command;
      
      // Recherche du fichier
      const file = await this.fileRepository.findById(payload.fileId);
      if (!file) {
        throw ErrorFactory.fileNotFound(payload.fileId);
      }

      // Vérification de l'accessibilité
      if (!file.canBeAccessed()) {
        if (file.isExpired()) {
          throw ErrorFactory.fileExpired(payload.fileId);
        } else if (file.hasReachedMaxDownloads()) {
          throw ErrorFactory.fileMaxDownloadsReached(payload.fileId);
        }
      }

      // Lecture du fichier chiffré
      const combinedData = await this.storageService.read(file.encryptedPath);
      const { encryptedData, iv, salt } = this.separateEncryptedData(combinedData);

      // Déchiffrement
      const decryptedData = await this.cryptoService.decryptFile(
        encryptedData,
        iv,
        salt,
        payload.password
      );

      // Incrémentation du compteur de téléchargements
      await this.fileRepository.incrementCount(file.id);

      // Génération de l'événement
      await eventBus.publish(FileEvents.fileDownloaded(file.id, {
        fileName: file.originalName,
        downloadCount: file.downloadCount + 1,
        userAgent: payload.metadata?.userAgent,
        ipAddress: payload.metadata?.ipAddress
      }));

      logger.info('File downloaded successfully', {
        fileId: file.id,
        fileName: file.originalName,
        downloadCount: file.downloadCount + 1,
        userAgent: payload.metadata?.userAgent,
        ipAddress: payload.metadata?.ipAddress
      });

      const result: FileDownloadResult = {
        fileName: file.originalName,
        mimeType: file.mimeType,
        content: decryptedData
      };

      return this.createSuccessResult(result);

    } catch (error) {
      logger.error('Failed to download file', { error, command });
      
      // If it's an AppError, preserve the original error code and details
      if (ErrorUtils.isAppError(error)) {
        return {
          success: false,
          error: error.toJSON()
        };
      }
      
      return this.createErrorResult('DOWNLOAD_FAILED', 'Failed to download file', error);
    }
  }

  /**
   * Supprime un fichier et son partage associé
   */
  async deleteFile(command: DeleteFileCommand): Promise<OperationResult<void>> {
    try {
      const { payload } = command;
      
      const file = await this.fileRepository.findById(payload.fileId);
      if (!file) {
        return this.createErrorResult('FILE_NOT_FOUND', 'File not found');
      }

      // Suppression du fichier physique
      try {
        await this.storageService.delete(file.encryptedPath);
      } catch (error) {
        logger.warn('Failed to delete physical file', { fileId: file.id, error });
      }

      // Suppression du partage associé
      const share = await this.shareRepository.findByFileId(file.id);
      if (share) {
        await this.shareRepository.delete(share.id);
      }

      // Suppression de l'enregistrement du fichier
      await this.fileRepository.delete(file.id);

      // Génération de l'événement
      await eventBus.publish(FileEvents.fileDeleted(file.id, {
        fileName: file.originalName,
        reason: payload.reason
      }));

      logger.info('File deleted successfully', {
        fileId: file.id,
        fileName: file.originalName,
        reason: payload.reason,
        userId: payload.userId
      });

      return this.createSuccessResult(undefined);

    } catch (error) {
      logger.error('Failed to delete file', { error, command });
      return this.createErrorResult('DELETE_FAILED', 'Failed to delete file', error);
    }
  }

  /**
   * Nettoie les fichiers expirés
   */
  async cleanupExpiredFiles(): Promise<OperationResult<{ deletedCount: number }>> {
    try {
      logger.info('Starting cleanup of expired files');
      
      const deletedFilesCount = await this.fileRepository.cleanup();
      const deletedSharesCount = await this.shareRepository.cleanup();
      
      // Nettoyage du stockage (fichiers orphelins)
      await this.storageService.cleanup();

      logger.info('Cleanup completed', {
        deletedFiles: deletedFilesCount,
        deletedShares: deletedSharesCount
      });

      return this.createSuccessResult({ deletedCount: deletedFilesCount });

    } catch (error) {
      logger.error('Failed to cleanup expired files', { error });
      return this.createErrorResult('CLEANUP_FAILED', 'Failed to cleanup expired files', error);
    }
  }

  // Méthodes utilitaires privées

  private async hashPassword(password: string): Promise<string> {
    // Utilisation simple pour le moment, pourrait être amélioré avec bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private combineEncryptedData(encryptedData: ArrayBuffer, iv: Uint8Array, salt: Uint8Array): ArrayBuffer {
    const combined = new Uint8Array(4 + salt.length + 4 + iv.length + encryptedData.byteLength);
    let offset = 0;

    // Salt length (4 bytes)
    new DataView(combined.buffer).setUint32(offset, salt.length, true);
    offset += 4;

    // Salt
    combined.set(salt, offset);
    offset += salt.length;

    // IV length (4 bytes)
    new DataView(combined.buffer).setUint32(offset, iv.length, true);
    offset += 4;

    // IV
    combined.set(iv, offset);
    offset += iv.length;

    // Encrypted data
    combined.set(new Uint8Array(encryptedData), offset);

    return combined.buffer;
  }

  private separateEncryptedData(combinedData: ArrayBuffer): {
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
    salt: Uint8Array;
  } {
    const view = new DataView(combinedData);
    let offset = 0;

    // Read salt length
    const saltLength = view.getUint32(offset, true);
    offset += 4;

    // Read salt
    const salt = new Uint8Array(combinedData, offset, saltLength);
    offset += saltLength;

    // Read IV length
    const ivLength = view.getUint32(offset, true);
    offset += 4;

    // Read IV
    const iv = new Uint8Array(combinedData, offset, ivLength);
    offset += ivLength;

    // Read encrypted data
    const encryptedData = combinedData.slice(offset);

    return { encryptedData, iv, salt };
  }

  private createSuccessResult<T>(data: T): OperationResult<T> {
    return {
      success: true,
      data
    };
  }

  private createErrorResult(code: string, message: string, details?: any): OperationResult {
    return {
      success: false,
      error: {
        code,
        message,
        details
      }
    };
  }
}
