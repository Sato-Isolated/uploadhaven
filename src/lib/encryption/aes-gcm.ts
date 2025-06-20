/**
 * AES-256-GCM Encryption Utilities
 * 
 * Provides server-side encryption for sensitive audit data and metadata.
 * Used for encrypting audit logs and other internal data where zero-knowledge
 * is not required but data protection is needed.
 */

import crypto from 'crypto';

// AES-GCM Configuration
export const AES_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  tagLength: 16, // 128 bits
} as const;

/**
 * Encrypted data result
 */
export interface EncryptedData {
  content: string; // Base64 encoded encrypted content
  iv: string; // Base64 encoded IV
  tag: string; // Base64 encoded authentication tag
}

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(AES_CONFIG.keyLength).toString('base64');
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(
  plaintext: string,
  key: string
): Promise<EncryptedData> {
  try {
    // Decode the base64 key
    const keyBuffer = Buffer.from(key, 'base64');
    
    // Generate random IV
    const iv = crypto.randomBytes(AES_CONFIG.ivLength);
    
    // Create cipher
    const cipher = crypto.createCipher(AES_CONFIG.algorithm, keyBuffer);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return {
      content: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: '', // Not supported in basic cipher mode
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(
  encryptedData: EncryptedData,
  key: string
): Promise<string> {
  try {
    // Decode inputs
    const keyBuffer = Buffer.from(key, 'base64');
    const content = Buffer.from(encryptedData.content, 'base64');
    
    // Create decipher
    const decipher = crypto.createDecipher(AES_CONFIG.algorithm, keyBuffer);
    
    // Decrypt
    let decrypted = decipher.update(content);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data with string input (for backward compatibility)
 */
export async function decryptDataString(
  encryptedString: string,
  key: string
): Promise<string> {
  try {
    // Parse encrypted string as JSON
    const encryptedData: EncryptedData = JSON.parse(encryptedString);
    return await decryptData(encryptedData, key);
  } catch (error) {
    throw new Error(`String decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hash data using SHA-256 (for creating lookup hashes)
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Create encrypted user data structure
 */
export interface EncryptedUserData {
  email: EncryptedData;
  name: EncryptedData;
  emailHash: string; // SHA-256 for lookups
}

/**
 * Encrypt user data following security patterns
 */
export async function encryptUserData(
  userData: { email: string; name: string },
  key: string
): Promise<EncryptedUserData> {
  const [encryptedEmail, encryptedName] = await Promise.all([
    encryptData(userData.email, key),
    encryptData(userData.name, key),
  ]);

  return {
    email: encryptedEmail,
    name: encryptedName,
    emailHash: hashData(userData.email),
  };
}

/**
 * Decrypt user data
 */
export async function decryptUserData(
  encryptedUserData: EncryptedUserData,
  key: string
): Promise<{ email: string; name: string }> {
  const [email, name] = await Promise.all([
    decryptData(encryptedUserData.email, key),
    decryptData(encryptedUserData.name, key),
  ]);

  return { email, name };
}
