/**
 * Server-side utility functions for UploadHaven
 * 
 * These are temporary bridge functions during the DDD migration.
 * They will be moved to appropriate domain services once migration is complete.
 */

import * as bcrypt from 'bcryptjs';
import { SharedFileModel } from '../../../domains/file-sharing/infrastructure/database/shared-file.model';

/**
 * Build full short URL for sharing
 */
export function buildShortUrl(shortId: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${base}/s/${shortId}`;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Save file metadata to database - temporary bridge function
 * This will be replaced by the UploadAnonymousUseCase
 */
export async function saveFileMetadata(params: {
  filename: string;
  shortUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  expiresAt: Date;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  isAnonymous?: boolean;
  password?: string;
  isPasswordProtected?: boolean;
  isZeroKnowledge?: boolean;
  zkMetadata?: {
    algorithm: string;
    iv: string;
    salt: string;
    iterations: number;
    encryptedSize: number;
    uploadTimestamp: number;
    keyHint: string;
    contentCategory: 'media' | 'document' | 'archive' | 'text' | 'other';
  };
}) {
  // Create new document using the DDD SharedFileModel
  const fileDocument = new SharedFileModel({
    fileId: params.shortUrl,
    encryptedBlob: Buffer.alloc(0), // Will be filled by actual implementation
    iv: params.zkMetadata?.iv || '',
    encryptedSize: params.size,
    uploadedAt: new Date(),
    expiresAt: params.expiresAt,
    maxDownloads: 10, // Default
    downloadCount: 0,
    isAvailable: true
  });

  return await fileDocument.save();
}
