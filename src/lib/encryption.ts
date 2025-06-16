/**
 * File Encryption Service
 *
 * This service provides secure file encryption/decryption using AES-256-GCM
 * with user-derived keys and per-file salts for maximum security.
 */

import { randomBytes, pbkdf2, createCipheriv, createDecipheriv } from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(pbkdf2);

// Encryption configuration
export const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  saltLength: 32, // 256 bits
  tagLength: 16, // 128 bits
  iterations: 100000, // PBKDF2 iterations
} as const;

export interface EncryptionMetadata {
  salt: Buffer;
  iv: Buffer;
  tag: Buffer;
  algorithm: string;
  iterations: number;
}

export interface EncryptedFile {
  encryptedData: Buffer;
  metadata: EncryptionMetadata;
}

export interface FileEncryptionResult {
  encryptedBuffer: Buffer;
  metadata: {
    salt: string; // base64 encoded
    iv: string; // base64 encoded
    tag: string; // base64 encoded
    algorithm: string;
    iterations: number;
  };
}

/**
 * Derives an encryption key from a password and salt using PBKDF2
 */
export async function deriveKey(
  password: string,
  salt: Buffer,
  iterations: number = ENCRYPTION_CONFIG.iterations
): Promise<Buffer> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }

  if (!salt || salt.length !== ENCRYPTION_CONFIG.saltLength) {
    throw new Error(`Salt must be ${ENCRYPTION_CONFIG.saltLength} bytes`);
  }

  return pbkdf2Async(
    password,
    salt,
    iterations,
    ENCRYPTION_CONFIG.keyLength,
    'sha512'
  );
}

/**
 * Generates a random salt for key derivation
 */
export function generateSalt(): Buffer {
  return randomBytes(ENCRYPTION_CONFIG.saltLength);
}

/**
 * Generates a random initialization vector
 */
export function generateIV(): Buffer {
  return randomBytes(ENCRYPTION_CONFIG.ivLength);
}

/**
 * Encrypts a file buffer using AES-256-GCM
 */
export async function encryptFile(
  fileBuffer: Buffer,
  password: string,
  salt?: Buffer
): Promise<FileEncryptionResult> {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('File buffer cannot be empty');
  }

  // Generate salt and IV if not provided
  const fileSalt = salt || generateSalt();
  const iv = generateIV();

  // Derive encryption key
  const key = await deriveKey(password, fileSalt);

  // Create cipher
  const cipher = createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);

  // Encrypt the file
  const encryptedChunks: Buffer[] = [];
  encryptedChunks.push(cipher.update(fileBuffer));
  encryptedChunks.push(cipher.final());

  // Get authentication tag
  const tag = cipher.getAuthTag();

  const encryptedBuffer = Buffer.concat(encryptedChunks);

  return {
    encryptedBuffer,
    metadata: {
      salt: fileSalt.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      algorithm: ENCRYPTION_CONFIG.algorithm,
      iterations: ENCRYPTION_CONFIG.iterations,
    },
  };
}

/**
 * Decrypts a file buffer using AES-256-GCM
 */
export async function decryptFile(
  encryptedBuffer: Buffer,
  password: string,
  metadata: {
    salt: string;
    iv: string;
    tag: string;
    algorithm: string;
    iterations: number;
  }
): Promise<Buffer> {
  if (!encryptedBuffer || encryptedBuffer.length === 0) {
    throw new Error('Encrypted buffer cannot be empty');
  }

  // Parse metadata
  const salt = Buffer.from(metadata.salt, 'base64');
  const iv = Buffer.from(metadata.iv, 'base64');
  const tag = Buffer.from(metadata.tag, 'base64');

  // Validate algorithm
  if (metadata.algorithm !== ENCRYPTION_CONFIG.algorithm) {
    throw new Error(`Unsupported algorithm: ${metadata.algorithm}`);
  }

  // Derive decryption key
  const key = await deriveKey(password, salt, metadata.iterations);

  // Create decipher
  const decipher = createDecipheriv(metadata.algorithm, key, iv);
  decipher.setAuthTag(tag);

  try {
    // Decrypt the file
    const decryptedChunks: Buffer[] = [];
    decryptedChunks.push(decipher.update(encryptedBuffer));
    decryptedChunks.push(decipher.final());

    return Buffer.concat(decryptedChunks);
  } catch {
    throw new Error('Decryption failed: Invalid password or corrupted data');
  }
}

/**
 * Encrypts a file stream (for large files)
 */
export async function encryptFileStream(
  inputStream: NodeJS.ReadableStream,
  password: string,
  salt?: Buffer
): Promise<{
  encryptedStream: NodeJS.ReadableStream;
  metadata: {
    salt: string;
    iv: string;
    tag: string;
    algorithm: string;
    iterations: number;
  };
}> {
  const fileSalt = salt || generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, fileSalt);

  const cipher = createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);

  // We need to collect the tag after the stream ends
  return new Promise((resolve, reject) => {
    const encryptedStream = inputStream.pipe(cipher);

    encryptedStream.on('end', () => {
      const tag = cipher.getAuthTag();
      resolve({
        encryptedStream,
        metadata: {
          salt: fileSalt.toString('base64'),
          iv: iv.toString('base64'),
          tag: tag.toString('base64'),
          algorithm: ENCRYPTION_CONFIG.algorithm,
          iterations: ENCRYPTION_CONFIG.iterations,
        },
      });
    });

    encryptedStream.on('error', reject);
  });
}

/**
 * Decrypts a file stream (for large files)
 */
export async function decryptFileStream(
  encryptedStream: NodeJS.ReadableStream,
  password: string,
  metadata: {
    salt: string;
    iv: string;
    tag: string;
    algorithm: string;
    iterations: number;
  }
): Promise<NodeJS.ReadableStream> {
  const salt = Buffer.from(metadata.salt, 'base64');
  const iv = Buffer.from(metadata.iv, 'base64');
  const tag = Buffer.from(metadata.tag, 'base64');

  if (metadata.algorithm !== ENCRYPTION_CONFIG.algorithm) {
    throw new Error(`Unsupported algorithm: ${metadata.algorithm}`);
  }

  const key = await deriveKey(password, salt, metadata.iterations);
  const decipher = createDecipheriv(metadata.algorithm, key, iv);
  decipher.setAuthTag(tag);

  return encryptedStream.pipe(decipher);
}

/**
 * Validates encryption metadata
 */
export function validateEncryptionMetadata(metadata: unknown): boolean {
  try {
    if (!metadata || typeof metadata !== 'object') {
      return false;
    }

    const metadataObj = metadata as Record<string, unknown>;

    return (
      typeof metadataObj.salt === 'string' &&
      typeof metadataObj.iv === 'string' &&
      typeof metadataObj.tag === 'string' &&
      typeof metadataObj.algorithm === 'string' &&
      typeof metadataObj.iterations === 'number' &&
      metadataObj.algorithm === ENCRYPTION_CONFIG.algorithm &&
      metadataObj.iterations > 0
    );
  } catch {
    return false;
  }
}

/**
 * Generates a secure random password for system-generated encryption keys
 */
export function generateSecurePassword(length: number = 64): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

/**
 * Wipes sensitive data from memory (best effort)
 */
export function wipeSensitiveData(buffer: Buffer): void {
  if (buffer && buffer.length > 0) {
    buffer.fill(0);
  }
}
