/**
 * Thumbnail Encryption System
 *
 * Handles encryption and decryption of generated thumbnails and preview content.
 * Part of the Phase 2 encryption enhancement for securing generated media.
 */

import { encryptFile, decryptFile } from './encryption';
import { getDefaultEncryptionPassword } from './encryption-config';
import { writeFile, readFile, mkdir, access } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import type { IFile } from '@/types/database';
import { extractVideoFrame } from '@/lib/media/video-frame-extraction';

/**
 * Thumbnail encryption configuration
 */
export interface ThumbnailConfig {
  enabled: boolean;
  cacheEncrypted: boolean;
  maxCacheSize: number; // Maximum cached thumbnails
  cacheDir: string;
  quality: number;
  size: number;
}

/**
 * Default thumbnail configuration
 */
const DEFAULT_THUMBNAIL_CONFIG: ThumbnailConfig = {
  enabled: false, // Will be enabled via environment variable
  cacheEncrypted: true,
  maxCacheSize: 1000,
  cacheDir: 'cache/thumbnails',
  quality: 80,
  size: 200,
};

/**
 * Load thumbnail configuration from environment
 */
function getThumbnailConfig(): ThumbnailConfig {
  return {
    enabled: process.env.THUMBNAIL_ENCRYPTION_ENABLED === 'true',
    cacheEncrypted: process.env.THUMBNAIL_CACHE_ENCRYPTED !== 'false',
    maxCacheSize: parseInt(process.env.THUMBNAIL_CACHE_SIZE || '1000'),
    cacheDir: process.env.THUMBNAIL_CACHE_DIR || DEFAULT_THUMBNAIL_CONFIG.cacheDir,
    quality: parseInt(process.env.THUMBNAIL_QUALITY || '80'),
    size: parseInt(process.env.THUMBNAIL_SIZE || '200'),
  };
}

/**
 * Encrypted thumbnail metadata
 */
export interface EncryptedThumbnailMetadata {
  salt: string; // base64 encoded
  iv: string; // base64 encoded
  tag: string; // base64 encoded
  algorithm: string;
  iterations: number;
  originalSize: number;
  encryptedSize: number;
  mimeType: string;
  generatedAt: Date;
}

/**
 * Generate and encrypt thumbnail for a file
 */
export async function generateEncryptedThumbnail(
  fileDoc: IFile,
  sourceBuffer: Buffer,
  mimeType: string
): Promise<{ thumbnailBuffer: Buffer; metadata: EncryptedThumbnailMetadata }> {
  const config = getThumbnailConfig();
  
  console.log('🖼️ Generating encrypted thumbnail for:', fileDoc.originalName);
  
  // Generate thumbnail based on file type
  let thumbnailBuffer: Buffer;
  
  if (mimeType.startsWith('image/')) {
    thumbnailBuffer = await generateImageThumbnail(sourceBuffer, config);
  } else if (mimeType.startsWith('video/')) {
    thumbnailBuffer = await generateVideoThumbnail(sourceBuffer, config);
  } else if (mimeType === 'application/pdf') {
    thumbnailBuffer = await generatePDFThumbnail(sourceBuffer, config);
  } else {
    thumbnailBuffer = await generatePlaceholderThumbnail(mimeType, config);
  }

  console.log(`📏 Generated thumbnail: ${thumbnailBuffer.length} bytes`);

  // Encrypt thumbnail if encryption is enabled
  if (config.enabled) {
    const password = getDefaultEncryptionPassword();
    if (!password) {
      throw new Error('Encryption password not available for thumbnail encryption');
    }

    console.log('🔒 Encrypting thumbnail...');
    const encryptionResult = await encryptFile(thumbnailBuffer, password);
      const metadata: EncryptedThumbnailMetadata = {
      salt: encryptionResult.metadata.salt,
      iv: encryptionResult.metadata.iv,
      tag: encryptionResult.metadata.tag,
      algorithm: encryptionResult.metadata.algorithm,
      iterations: encryptionResult.metadata.iterations,
      originalSize: thumbnailBuffer.length,
      encryptedSize: encryptionResult.encryptedBuffer.length,
      mimeType: 'image/webp',
      generatedAt: new Date(),
    };

    console.log('✅ Thumbnail encrypted successfully');
    return {
      thumbnailBuffer: encryptionResult.encryptedBuffer,
      metadata,
    };
  } else {    // Return unencrypted thumbnail with minimal metadata
    const metadata: EncryptedThumbnailMetadata = {
      algorithm: 'none',
      salt: '',
      iv: '',
      tag: '',
      iterations: 0,
      originalSize: thumbnailBuffer.length,
      encryptedSize: thumbnailBuffer.length,
      mimeType: 'image/webp',
      generatedAt: new Date(),
    };

    return {
      thumbnailBuffer,
      metadata,
    };
  }
}

/**
 * Decrypt thumbnail data
 */
export async function decryptThumbnail(
  encryptedBuffer: Buffer,
  metadata: EncryptedThumbnailMetadata
): Promise<Buffer> {
  const config = getThumbnailConfig();
  
  // If thumbnail is not encrypted or encryption is disabled
  if (!config.enabled || metadata.algorithm === 'none') {
    return encryptedBuffer;
  }

  console.log('🔓 Decrypting thumbnail...');
  
  const password = getDefaultEncryptionPassword();
  if (!password) {
    throw new Error('Encryption password not available for thumbnail decryption');
  }
  try {
    // Convert metadata to the format expected by decryptFile
    const decryptionMetadata = {
      salt: metadata.salt,
      iv: metadata.iv,
      tag: metadata.tag,
      algorithm: metadata.algorithm,
      iterations: metadata.iterations,
    };
    
    const decryptedBuffer = await decryptFile(encryptedBuffer, password, decryptionMetadata);
    console.log('✅ Thumbnail decrypted successfully');
    return decryptedBuffer;
  } catch (error) {
    console.error('❌ Thumbnail decryption failed:', error);
    throw new Error('Failed to decrypt thumbnail');
  }
}

/**
 * Generate image thumbnail
 */
async function generateImageThumbnail(
  sourceBuffer: Buffer,
  config: ThumbnailConfig
): Promise<Buffer> {
  return await sharp(sourceBuffer)
    .resize(config.size, config.size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: config.quality })
    .toBuffer();
}

/**
 * Generate video thumbnail (enhanced with ffmpeg frame extraction)
 */
async function generateVideoThumbnail(
  sourceBuffer: Buffer,
  config: ThumbnailConfig
): Promise<Buffer> {
  try {
    // Try to extract actual video frame
    const frameBuffer = await extractVideoFrame(sourceBuffer, {
      timestamp: '00:00:01.000',
      quality: config.quality,
      maxWidth: config.size * 2, // Get higher res for better quality after resize
      maxHeight: config.size * 2,
    });

    // Resize the extracted frame to thumbnail size
    return await sharp(frameBuffer)
      .resize(config.size, config.size, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: config.quality })
      .toBuffer();
  } catch (error) {
    console.error('Failed to extract video frame:', error);
    // Fall back to placeholder
    return await generatePlaceholderThumbnail('video/', config, '🎥', '#8B5CF6');
  }
}

/**
 * Generate PDF thumbnail (placeholder for now, can be enhanced with pdf2pic)
 */
async function generatePDFThumbnail(
  sourceBuffer: Buffer,
  config: ThumbnailConfig
): Promise<Buffer> {
  // For now, generate a PDF placeholder
  // TODO: Implement pdf2pic-based page extraction
  return await generatePlaceholderThumbnail('application/pdf', config, '📄', '#EF4444');
}

/**
 * Generate placeholder thumbnail with icon and color
 */
async function generatePlaceholderThumbnail(
  mimeType: string,
  config: ThumbnailConfig,
  emoji?: string,
  bgColor?: string
): Promise<Buffer> {
  // Auto-detect emoji and color if not provided
  if (!emoji || !bgColor) {
    if (mimeType.startsWith('video/')) {
      emoji = '🎥';
      bgColor = '#8B5CF6';
    } else if (mimeType === 'application/pdf') {
      emoji = '📄';
      bgColor = '#EF4444';
    } else if (mimeType.startsWith('audio/')) {
      emoji = '🎵';
      bgColor = '#10B981';
    } else if (mimeType.startsWith('text/')) {
      emoji = '📝';
      bgColor = '#3B82F6';
    } else {
      emoji = '📄';
      bgColor = '#6B7280';
    }
  }

  const svg = `
    <svg width="${config.size}" height="${config.size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}" rx="8"/>
      <text x="50%" y="50%" font-size="60" text-anchor="middle" dominant-baseline="central" fill="white">
        ${emoji}
      </text>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .webp({ quality: config.quality })
    .toBuffer();
}

/**
 * Cache management for encrypted thumbnails
 */
export class ThumbnailCache {
  private cacheDir: string;
  private config: ThumbnailConfig;

  constructor() {
    this.config = getThumbnailConfig();
    this.cacheDir = path.join(process.cwd(), this.config.cacheDir);
  }

  /**
   * Initialize cache directory
   */
  async initialize(): Promise<void> {
    try {
      await mkdir(this.cacheDir, { recursive: true });
      console.log('📁 Thumbnail cache directory initialized:', this.cacheDir);
    } catch (error) {
      console.error('Failed to initialize thumbnail cache directory:', error);
    }
  }

  /**
   * Get cache key for a file
   */
  private getCacheKey(fileId: string, shortUrl: string): string {
    return `${fileId}_${shortUrl}.webp`;
  }

  /**
   * Get cache metadata key
   */
  private getMetadataKey(fileId: string, shortUrl: string): string {
    return `${fileId}_${shortUrl}.json`;
  }

  /**
   * Check if thumbnail exists in cache
   */
  async exists(fileId: string, shortUrl: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(fileId, shortUrl);
    const cachePath = path.join(this.cacheDir, cacheKey);
    
    try {
      await access(cachePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Store thumbnail in cache
   */
  async store(
    fileId: string,
    shortUrl: string,
    thumbnailBuffer: Buffer,
    metadata: EncryptedThumbnailMetadata
  ): Promise<void> {
    const cacheKey = this.getCacheKey(fileId, shortUrl);
    const metadataKey = this.getMetadataKey(fileId, shortUrl);
    
    const cachePath = path.join(this.cacheDir, cacheKey);
    const metadataPath = path.join(this.cacheDir, metadataKey);

    try {
      await writeFile(cachePath, thumbnailBuffer);
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      console.log('💾 Thumbnail cached:', cacheKey);
    } catch (error) {
      console.error('Failed to cache thumbnail:', error);
    }
  }

  /**
   * Retrieve thumbnail from cache
   */
  async retrieve(
    fileId: string,
    shortUrl: string
  ): Promise<{ thumbnailBuffer: Buffer; metadata: EncryptedThumbnailMetadata } | null> {
    const cacheKey = this.getCacheKey(fileId, shortUrl);
    const metadataKey = this.getMetadataKey(fileId, shortUrl);
    
    const cachePath = path.join(this.cacheDir, cacheKey);
    const metadataPath = path.join(this.cacheDir, metadataKey);

    try {
      const thumbnailBuffer = await readFile(cachePath);
      const metadataJson = await readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataJson) as EncryptedThumbnailMetadata;
        console.log('🎯 Thumbnail retrieved from cache:', cacheKey);
      return { thumbnailBuffer, metadata };
    } catch {
      console.log('Cache miss for thumbnail:', cacheKey);
      return null;
    }
  }
  /**
   * Clear expired cache entries
   */
  async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    console.log('🧹 Starting thumbnail cache cleanup...');
    
    try {
      const { readdir, stat, unlink } = await import('fs/promises');
      
      // Ensure cache directory exists
      try {
        await readdir(this.cacheDir);
      } catch {
        console.log('Cache directory does not exist, nothing to clean');
        return;
      }
      
      const files = await readdir(this.cacheDir);
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        
        try {
          const fileStats = await stat(filePath);
          const age = now - fileStats.mtime.getTime();
          
          if (age > maxAge) {
            await unlink(filePath);
            cleanedCount++;
            console.log(`🗑️ Removed expired cache file: ${file}`);
          }
        } catch (error) {
          console.error(`Failed to process cache file ${file}:`, error);
        }
      }
      
      console.log(`✅ Cleaned up ${cleanedCount} expired cache entries`);
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error);
      throw error;
    }
  }
}

/**
 * Global thumbnail cache instance
 */
export const thumbnailCache = new ThumbnailCache();
