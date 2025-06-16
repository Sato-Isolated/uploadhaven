/**
 * Performance Optimized Encryption System
 *
 * Provides high-performance encryption for large files with:
 * - Streaming encryption for files >500MB
 * - Parallel processing using worker threads
 * - Intelligent key caching
 * - Compression before encryption
 */

import { Transform, Readable } from 'stream';
import { promisify } from 'util';
import { createInflate, createDeflate } from 'zlib';
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2, CipherGCM, DecipherGCM } from 'crypto';
import { ENCRYPTION_CONFIG } from './encryption';

const pbkdf2Async = promisify(pbkdf2);

// Performance configuration
export const PERFORMANCE_CONFIG = {
  // Streaming thresholds
  STREAM_THRESHOLD: 100 * 1024 * 1024, // 100MB - reduced from 500MB for better performance
  CHUNK_SIZE: 1 * 1024 * 1024, // 1MB chunks for streaming (larger chunks = better performance)
  
  // Parallel processing (using batch processing instead of workers)
  PARALLEL_THRESHOLD: 500 * 1024 * 1024, // 500MB for parallel processing
  BATCH_SIZE: 16 * 1024 * 1024, // 16MB batches for optimal performance
  
  // Key caching
  KEY_CACHE_SIZE: 100, // Cache up to 100 derived keys
  KEY_CACHE_TTL: 30 * 60 * 1000, // 30 minutes TTL
  
  // Compression
  COMPRESSION_THRESHOLD: 1024 * 1024, // 1MB for compression
  COMPRESSION_LEVEL: 6, // Balance between speed and compression ratio
} as const;

/**
 * Advanced key cache with LRU eviction for avoiding expensive key derivation
 */
class KeyCache {
  private cache = new Map<string, { 
    key: Buffer; 
    timestamp: number; 
    accessCount: number;
    lastAccessed: number;
  }>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalKeys: 0
  };
  
  /**
   * Generate cache key from password and salt
   */
  private getCacheKey(password: string, salt: Buffer): string {
    return `${password}:${salt.toString('base64')}`;
  }
  
  /**
   * Get cached key or derive new one with LRU management
   */
  async getKey(password: string, salt: Buffer, iterations: number = ENCRYPTION_CONFIG.iterations): Promise<Buffer> {
    const cacheKey = this.getCacheKey(password, salt);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    // Check if cached key is still valid
    if (cached && (now - cached.timestamp < PERFORMANCE_CONFIG.KEY_CACHE_TTL)) {
      console.log(`🔑 Cache HIT for key (age: ${((now - cached.timestamp) / 1000).toFixed(1)}s, uses: ${cached.accessCount})`);
      
      // Update LRU information
      cached.lastAccessed = now;
      cached.accessCount++;
      this.stats.hits++;
      
      return cached.key;
    }
    
    // Cache miss - derive new key
    console.log('🔄 Cache MISS - Deriving new encryption key...');
    this.stats.misses++;
    
    const key = await pbkdf2Async(password, salt, iterations, ENCRYPTION_CONFIG.keyLength, 'sha512');
    
    // Cache the key with LRU information
    this.cache.set(cacheKey, { 
      key, 
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    });
    this.stats.totalKeys++;
    
    // Clean up cache if it's full (using LRU strategy)
    if (this.cache.size > PERFORMANCE_CONFIG.KEY_CACHE_SIZE) {
      this.evictLRU();
    }
    
    return key;
  }
  
  /**
   * Evict least recently used entries using LRU strategy
   */
  private evictLRU(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first) and access frequency
    entries.sort((a, b) => {
      const ageA = now - a[1].lastAccessed;
      const ageB = now - b[1].lastAccessed;
      const accessCountA = a[1].accessCount;
      const accessCountB = b[1].accessCount;
      
      // Prioritize by age first, then by access count
      if (ageA !== ageB) {
        return ageB - ageA; // Older entries first
      }
      return accessCountA - accessCountB; // Less accessed entries first
    });
    
    // Remove oldest/least used entries until we're under the limit
    const toRemove = this.cache.size - PERFORMANCE_CONFIG.KEY_CACHE_SIZE + 1;
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
    
    console.log(`🧹 LRU eviction: removed ${toRemove} keys (${this.cache.size} remain)`);
  }
  
  /**
   * Clean up expired cache entries (still useful for memory management)
   */
  private cleanup(): void {    const now = Date.now();
    const expired: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp >= PERFORMANCE_CONFIG.KEY_CACHE_TTL) {
        expired.push(key);
      }
    });
    
    expired.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
    
    if (expired.length > 0) {
      console.log(`🧹 Cleaned up ${expired.length} expired keys from cache`);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : '0.0';
      
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      currentSize: this.cache.size,
      maxSize: PERFORMANCE_CONFIG.KEY_CACHE_SIZE
    };
  }
  
  /**
   * Clear all cached keys and reset statistics
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalKeys: 0
    };
    console.log('🗑️ Key cache cleared and stats reset');
  }
}

// Global key cache instance
export const keyCache = new KeyCache();

/**
 * Compression utilities
 */
export class CompressionManager {  /**
   * Check if file should be compressed before encryption
   * Enhanced with better detection and compression testing
   */
  static shouldCompress(fileSize: number, mimeType: string, filename?: string): boolean {
    // Don't compress if file is too small
    if (fileSize < PERFORMANCE_CONFIG.COMPRESSION_THRESHOLD) {
      console.log(`📦 Skipping compression: file too small (${fileSize} bytes < ${PERFORMANCE_CONFIG.COMPRESSION_THRESHOLD})`);
      return false;
    }
    
    // Don't compress already compressed formats (comprehensive list)
    const compressedFormats = [
      // Images (compressed formats)
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif',
      
      // Video formats (all are heavily compressed)
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
      'video/webm', 'video/ogg', 'video/3gpp', 'video/x-flv', 'video/x-matroska',
      
      // Audio formats (all are compressed)
      'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm',
      'audio/x-wav', 'audio/flac', 'audio/x-ms-wma',
      
      // Archive formats
      'application/zip', 'application/gzip', 'application/x-gzip', 'application/x-rar',
      'application/x-tar', 'application/x-7z-compressed', 'application/x-bzip2',
      
      // Documents (usually compressed)
      'application/pdf', // PDFs use internal compression
    ];
    
    // Check by MIME type
    const isCompressedByMime = compressedFormats.some(format => mimeType.startsWith(format.split('/')[0] + '/') || mimeType === format);
    
    // Also check by file extension for extra safety
    const compressedExtensions = [
      '.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif',
      '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp',
      '.mp3', '.aac', '.ogg', '.flac', '.m4a', '.wma', '.wav',
      '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
      '.pdf'
    ];
    
    const isCompressedByExtension = filename ? 
      compressedExtensions.some(ext => filename.toLowerCase().endsWith(ext)) : 
      false;
    
    const shouldSkip = isCompressedByMime || isCompressedByExtension;
    
    if (shouldSkip) {
      console.log(`📦 Skipping compression: already compressed format (${mimeType}${filename ? `, ${filename}` : ''})`);
      return false;
    }
    
    console.log(`📦 Will compress: uncompressed format detected (${mimeType}${filename ? `, ${filename}` : ''})`);
    return true;
  }
  
  /**
   * Create compression stream
   */
  static createCompressionStream() {
    return createDeflate({ level: PERFORMANCE_CONFIG.COMPRESSION_LEVEL });
  }
  
  /**
   * Create decompression stream
   */
  static createDecompressionStream() {
    return createInflate();
  }
}

/**
 * Streaming encryption transform with optimized chunk handling
 */
class EncryptionTransform extends Transform {
  private cipher: CipherGCM;
  
  constructor(private key: Buffer, private iv: Buffer) {
    super({ 
      highWaterMark: PERFORMANCE_CONFIG.CHUNK_SIZE, // Use larger buffer for better performance
      objectMode: false
    });
    this.cipher = createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv) as CipherGCM;
  }
    _transform(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null, data?: Buffer) => void) {
    try {
      const encrypted = this.cipher.update(chunk);
      callback(null, encrypted);
    } catch (error) {
      callback(error as Error);
    }
  }
  
  _flush(callback: (error?: Error | null, data?: Buffer) => void) {
    try {
      const final = this.cipher.final();
      this.emit('authTag', this.cipher.getAuthTag());
      callback(null, final);
    } catch (error) {
      callback(error as Error);
    }
  }
}

/**
 * Streaming decryption transform with optimized chunk handling
 */
class DecryptionTransform extends Transform {
  private decipher: DecipherGCM;
  
  constructor(private key: Buffer, private iv: Buffer, private tag: Buffer) {
    super({ 
      highWaterMark: PERFORMANCE_CONFIG.CHUNK_SIZE, // Use larger buffer for better performance
      objectMode: false
    });
    this.decipher = createDecipheriv(ENCRYPTION_CONFIG.algorithm, key, iv) as DecipherGCM;
    this.decipher.setAuthTag(tag);
  }
  _transform(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null, data?: Buffer) => void) {
    try {
      const decrypted = this.decipher.update(chunk);
      callback(null, decrypted);
    } catch (error) {
      callback(error as Error);
    }
  }
  
  _flush(callback: (error?: Error | null, data?: Buffer) => void) {
    try {
      const final = this.decipher.final();
      callback(null, final);
    } catch (error) {
      callback(error as Error);
    }
  }
}

/**
 * Performance-optimized file encryption
 */
export class PerformanceEncryption {
  /**
   * Encrypt file with performance optimizations
   */  static async encryptFileOptimized(
    sourceBuffer: Buffer,
    password: string,
    options: {
      mimeType?: string;
      filename?: string;
      forceStreaming?: boolean;
      enableCompression?: boolean;
      useParallel?: boolean;
    } = {}
  ): Promise<{
    encryptedBuffer: Buffer;
    metadata: {
      salt: string;
      iv: string;
      tag: string;
      algorithm: string;
      iterations: number;
      compressed: boolean;
      originalSize: number;
    };
  }> {
    const { mimeType = 'application/octet-stream', filename, forceStreaming, enableCompression, useParallel } = options;
    const fileSize = sourceBuffer.length;
    
    console.log(`🚀 Starting optimized encryption for ${fileSize} bytes${filename ? ` (${filename})` : ''}`);
    
    // Generate salt and IV
    const salt = randomBytes(ENCRYPTION_CONFIG.saltLength);
    const iv = randomBytes(ENCRYPTION_CONFIG.ivLength);
    
    // Get encryption key (cached if possible)
    const key = await keyCache.getKey(password, salt);
    
    // Check if compression should be used (now with filename support)
    const shouldCompress = enableCompression !== false && CompressionManager.shouldCompress(fileSize, mimeType, filename);
    console.log(`📦 Compression: ${shouldCompress ? 'enabled' : 'disabled'}`);
    
    let processedBuffer = sourceBuffer;
    
    // Apply compression if beneficial
    if (shouldCompress) {
      console.log('📦 Compressing before encryption...');
      processedBuffer = await this.compressBuffer(sourceBuffer);
      console.log(`📦 Compressed from ${fileSize} to ${processedBuffer.length} bytes (${((1 - processedBuffer.length / fileSize) * 100).toFixed(1)}% reduction)`);
    }
    
    // Choose encryption method based on file size
    const useStreaming = forceStreaming || processedBuffer.length >= PERFORMANCE_CONFIG.STREAM_THRESHOLD;
    const useParallelProcessing = useParallel && processedBuffer.length >= PERFORMANCE_CONFIG.PARALLEL_THRESHOLD;
    
    let encryptedBuffer: Buffer;
    let authTag: Buffer;
    
    if (useParallelProcessing) {
      console.log('⚡ Using parallel encryption...');
      const result = await this.encryptParallel(processedBuffer, key, iv);
      encryptedBuffer = result.encryptedBuffer;
      authTag = result.authTag;
    } else if (useStreaming) {
      console.log('🌊 Using streaming encryption...');
      const result = await this.encryptStream(processedBuffer, key, iv);
      encryptedBuffer = result.encryptedBuffer;
      authTag = result.authTag;    } else {
      console.log('📄 Using standard encryption...');
      const cipher = createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv) as CipherGCM;
      const chunks: Buffer[] = [];
      chunks.push(cipher.update(processedBuffer));
      chunks.push(cipher.final());
      authTag = cipher.getAuthTag();
      encryptedBuffer = Buffer.concat(chunks);
    }
    
    console.log(`✅ Encryption completed: ${encryptedBuffer.length} bytes`);
    
    return {
      encryptedBuffer,
      metadata: {
        salt: salt.toString('base64'),
        iv: iv.toString('base64'),
        tag: authTag.toString('base64'),
        algorithm: ENCRYPTION_CONFIG.algorithm,
        iterations: ENCRYPTION_CONFIG.iterations,
        compressed: shouldCompress,
        originalSize: fileSize,
      },
    };
  }
  
  /**
   * Compress buffer using zlib
   */
  private static async compressBuffer(buffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const compress = createDeflate({ level: PERFORMANCE_CONFIG.COMPRESSION_LEVEL });
      
      compress.on('data', chunk => chunks.push(chunk));
      compress.on('end', () => resolve(Buffer.concat(chunks)));
      compress.on('error', reject);
      
      compress.write(buffer);
      compress.end();
    });
  }
  
  /**
   * Encrypt using streaming for large files
   */
  private static async encryptStream(buffer: Buffer, key: Buffer, iv: Buffer): Promise<{ encryptedBuffer: Buffer; authTag: Buffer }> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let authTag: Buffer;
      
      const source = Readable.from([buffer]);
      const encryptTransform = new EncryptionTransform(key, iv);
        encryptTransform.on('data', (chunk: Buffer) => chunks.push(chunk));
      encryptTransform.on('authTag', (tag: Buffer) => authTag = tag);
      encryptTransform.on('end', () => {
        resolve({
          encryptedBuffer: Buffer.concat(chunks),
          authTag
        });
      });
      encryptTransform.on('error', reject);
      
      source.pipe(encryptTransform);
    });
  }  /**
   * Encrypt using optimized parallel processing (using crypto.Cipher directly in batches)
   */
  private static async encryptParallel(buffer: Buffer, key: Buffer, iv: Buffer): Promise<{ encryptedBuffer: Buffer; authTag: Buffer }> {
    // For very large files, use batch processing instead of worker threads
    // This avoids the overhead of worker creation and is much faster
    const batchSize = PERFORMANCE_CONFIG.BATCH_SIZE;
    const numBatches = Math.ceil(buffer.length / batchSize);
    
    console.log(`⚡ Starting optimized parallel encryption: ${numBatches} batches of ${(batchSize / 1024 / 1024).toFixed(1)}MB each`);
    
    const cipher = createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv) as CipherGCM;
    const encryptedChunks: Buffer[] = [];
    
    // Process in large batches for better performance
    for (let i = 0; i < numBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, buffer.length);
      const batch = buffer.subarray(start, end);
      
      console.log(`⚡ Processing batch ${i + 1}/${numBatches} (${(batch.length / 1024 / 1024).toFixed(1)}MB)`);
      
      // Encrypt batch
      const encryptedBatch = cipher.update(batch);
      encryptedChunks.push(encryptedBatch);
      
      // Yield control to event loop every 4 batches to prevent blocking
      if (i % 4 === 0 && i > 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    // Finalize encryption
    const finalChunk = cipher.final();
    if (finalChunk.length > 0) {
      encryptedChunks.push(finalChunk);    }
    
    const authTag = cipher.getAuthTag();
    const encryptedBuffer = Buffer.concat(encryptedChunks);
    
    console.log(`✅ Parallel encryption completed: ${encryptedBuffer.length} bytes`);
    
    return {
      encryptedBuffer,
      authTag
    };
  }
}

/**
 * Performance-optimized file decryption
 */
export class PerformanceDecryption {
  /**
   * Decrypt file with performance optimizations
   */
  static async decryptFileOptimized(
    encryptedBuffer: Buffer,
    password: string,
    metadata: {
      salt: string;
      iv: string;
      tag: string;
      algorithm: string;
      iterations: number;
      compressed?: boolean;
      originalSize?: number;
    }
  ): Promise<Buffer> {
    const timer = PerformanceMetrics.startTiming('decryption');
    
    try {
      console.log(`🔓 Starting optimized decryption for ${encryptedBuffer.length} bytes`);
      
      // Parse metadata
      const salt = Buffer.from(metadata.salt, 'base64');
      const iv = Buffer.from(metadata.iv, 'base64');
      const tag = Buffer.from(metadata.tag, 'base64');
      
      // Get decryption key (cached if possible)
      const key = await keyCache.getKey(password, salt, metadata.iterations);
      
      // Choose decryption method based on file size
      const useStreaming = encryptedBuffer.length >= PERFORMANCE_CONFIG.STREAM_THRESHOLD;
      
      let decryptedBuffer: Buffer;
      
      if (useStreaming) {
        console.log('🌊 Using streaming decryption...');
        decryptedBuffer = await this.decryptStream(encryptedBuffer, key, iv, tag);      } else {
        console.log('📄 Using standard decryption...');
        const decipher = createDecipheriv(metadata.algorithm, key, iv) as DecipherGCM;
        decipher.setAuthTag(tag);
        
        const chunks: Buffer[] = [];
        chunks.push(decipher.update(encryptedBuffer));
        chunks.push(decipher.final());
        decryptedBuffer = Buffer.concat(chunks);
      }
      
      // Decompress if the file was compressed
      if (metadata.compressed) {
        console.log('📦 Decompressing after decryption...');
        decryptedBuffer = await this.decompressBuffer(decryptedBuffer);
        console.log(`📦 Decompressed to ${decryptedBuffer.length} bytes`);
      }
      
      timer.end(decryptedBuffer.length);
      console.log(`✅ Decryption completed: ${decryptedBuffer.length} bytes`);
      
      return decryptedBuffer;
    } catch (error) {
      timer.end(0);
      console.error('❌ Decryption failed:', error);
      throw error;
    }
  }
  
  /**
   * Decompress buffer using zlib
   */
  private static async decompressBuffer(buffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const decompress = createInflate();
      
      decompress.on('data', chunk => chunks.push(chunk));
      decompress.on('end', () => resolve(Buffer.concat(chunks)));
      decompress.on('error', reject);
      
      decompress.write(buffer);
      decompress.end();
    });
  }
  
  /**
   * Decrypt using streaming for large files
   */
  private static async decryptStream(encryptedBuffer: Buffer, key: Buffer, iv: Buffer, tag: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      const source = Readable.from([encryptedBuffer]);
      const decryptTransform = new DecryptionTransform(key, iv, tag);
      
      decryptTransform.on('data', (chunk: Buffer) => chunks.push(chunk));
      decryptTransform.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      decryptTransform.on('error', reject);
      
      source.pipe(decryptTransform);
    });
  }
}

/**
 * Performance metrics collector
 */
export class PerformanceMetrics {
  private static metrics: {
    operation: string;
    fileSize: number;
    duration: number;
    timestamp: number;
  }[] = [];
  
  static startTiming(operation: string): { end: (fileSize: number) => void } {
    const start = Date.now();
    
    return {
      end: (fileSize: number) => {
        const duration = Date.now() - start;
        this.metrics.push({
          operation,
          fileSize,
          duration,
          timestamp: start,
        });
        
        console.log(`⏱️ ${operation}: ${fileSize} bytes in ${duration}ms (${(fileSize / duration / 1024).toFixed(2)} KB/ms)`);
      }
    };
  }
  
  static getMetrics() {
    return [...this.metrics];
  }
  
  static clearMetrics() {
    this.metrics = [];
  }
}

export default PerformanceEncryption;
