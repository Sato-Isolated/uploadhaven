/**
 * File Service - File Sharing Domain Bridge
 * 
 * Provides file upload/download operations bridging to the file-sharing domain.
 * Focuses only on file operations following SRP.
 * 
 * @domain file-sharing
 * @pattern Service Layer (DDD)
 */

import { DomainContainer } from '../di/domain-container';

export class FileService {

  /**
   * Anonymous file upload - bridges to domain
   */
  static async uploadAnonymous(file: File, options?: {
    expirationHours?: number;
    maxDownloads?: number;
    password?: string;
  }) {
    const container = DomainContainer.getInstance();
    const uploadUseCase = container.getUploadAnonymousUseCase();
    return await uploadUseCase.execute({
      file,
      ttlHours: options?.expirationHours ?? 24,
      maxDownloads: options?.maxDownloads ?? 10,
      password: options?.password,
    });
  }
  /**
   * File download - bridges to domain  
   */
  static async downloadFile(fileId: string, encryptionKey?: string) {
    const container = DomainContainer.getInstance();
    const downloadUseCase = container.getDownloadFileUseCase();

    return await downloadUseCase.execute({
      fileId
    });
  }

  /**
   * Zero-Knowledge file upload (legacy implementation)
   * TODO: Move this logic to the file-sharing domain
   */
  static async uploadZeroKnowledgeFile(params: {
    encryptedBuffer: Buffer;
    publicMetadata: {
      size: number;
      algorithm: string;
      iv: string;
      salt: string;
      iterations: number;
      uploadTimestamp: number;
      contentCategory?: string;
    };
    keyData: {
      key?: string;
      salt: string;
      isPasswordDerived: boolean;
    };
    userOptions: {
      password?: string;
      autoGenerateKey?: boolean;
      expiration: string;
      originalType?: string;
      originalName?: string;
    };
    expiresAt: Date;
    userId?: string;
    clientIP: string;
    userAgent: string;
  }): Promise<{
    fileId: string;
    shareUrl: string;
    isPasswordProtected: boolean;
    generatedKey?: string;
  }> {
    // TODO: Move this implementation to file-sharing domain UploadZKFileUseCase
    const { nanoid } = await import('nanoid');
    const path = await import('path');
    const { writeFile, mkdir } = await import('fs/promises');
    const { saveFileMetadata, buildShortUrl, hashPassword } = await import('../utils/server-utils');

    // Generate unique filename for encrypted blob
    const uniqueId = nanoid(10);
    const fileName = `${uniqueId}.zkblob`;

    // Handle password protection
    let hashedPassword: string | undefined;
    let isPasswordProtected = false;
    let generatedKey: string | undefined;

    if (params.userOptions.autoGenerateKey) {
      generatedKey = nanoid(16);
      hashedPassword = await hashPassword(generatedKey);
      isPasswordProtected = true;
    } else if (params.userOptions.password?.trim()) {
      hashedPassword = await hashPassword(params.userOptions.password.trim());
      isPasswordProtected = true;
    }

    // Determine storage subdirectory
    const subDir = isPasswordProtected ? 'protected' : 'public';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subDir);
    await mkdir(uploadsDir, { recursive: true });

    // Save encrypted blob to disk
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, params.encryptedBuffer);

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shortId = nanoid(8);
    const shareableUrl = buildShortUrl(shortId, baseUrl);

    // Save metadata to database
    const savedFile = await saveFileMetadata({
      filename: `${subDir}/${fileName}`,
      shortUrl: shortId,
      originalName: 'encrypted-file',
      mimeType: 'application/octet-stream',
      size: params.publicMetadata.size,
      expiresAt: params.expiresAt,
      ipAddress: params.clientIP,
      userAgent: params.userAgent,
      userId: params.userId,
      isAnonymous: !params.userId,
      password: hashedPassword,
      isPasswordProtected,
      isZeroKnowledge: true,
      zkMetadata: {
        algorithm: params.publicMetadata.algorithm,
        iv: params.publicMetadata.iv,
        salt: params.publicMetadata.salt,
        iterations: params.publicMetadata.iterations,
        encryptedSize: params.publicMetadata.size,
        uploadTimestamp: params.publicMetadata.uploadTimestamp,
        keyHint: params.keyData.isPasswordDerived ? 'password' : 'embedded',
        contentCategory: (params.publicMetadata.contentCategory as 'media' | 'document' | 'archive' | 'text' | 'other') || 'other',
      },
    });

    return {
      fileId: savedFile._id.toString(),
      shareUrl: shareableUrl,
      isPasswordProtected,
      generatedKey,
    };
  }

  /**
   * Log security event related to file operations
   */
  static async logSecurityEvent(params: {
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    clientIP: string;
    userAgent: string;
    userId?: string;
  }): Promise<void> {
    const container = DomainContainer.getInstance();
    const logSecurityEventUseCase = container.getLogSecurityEventUseCase(); await logSecurityEventUseCase.execute({
      eventType: params.type,
      severity: params.severity,
      context: {
        source: 'upload',
        action: 'threat_blocked',
        clientIP: params.clientIP
      },
      metadata: {
        // Only valid metadata properties allowed
      }
    });
  }
}
