/**
 * Zero-Knowledge Client-Side Encryption
 *
 * This module provides true Zero-Knowledge encryption where files are encrypted
 * entirely on the client-side before upload. The server never has access to
 * decryption keys or plaintext content.
 *
 * Key Features:
 * - Client-side AES-256-GCM encryption using Web Crypto API
 * - PBKDF2 key derivation with unique salts
 * - Encrypted file metadata (filename, mimetype)
 * - Share links with embedded keys or password-derived keys
 * - Server acts as dumb storage only
 */

// Zero-Knowledge encryption configuration
export const ZK_CONFIG = {
  algorithm: 'AES-GCM' as const,
  keyLength: 256, // 256 bits
  ivLength: 12, // 96 bits for GCM
  saltLength: 32, // 256 bits
  tagLength: 16, // 128 bits
  iterations: 100000, // PBKDF2 iterations
  keyFormat: 'raw' as const,
} as const;

/**
 * Encrypted file package that gets uploaded to server
 */
export interface ZKEncryptedPackage {
  encryptedData: ArrayBuffer; // Encrypted file content + metadata
  publicMetadata: {
    size: number; // Size of encrypted data
    algorithm: string;
    iv: string; // Base64 encoded IV
    salt: string; // Base64 encoded salt
    iterations: number;
    uploadTimestamp: number;
    // Note: No plaintext filename or mimetype
  };
}

/**
 * File metadata that gets encrypted with the file content
 */
export interface ZKFileMetadata {
  filename: string;
  mimetype: string;
  size: number; // Original file size
  timestamp: number;
}

/**
 * Encryption result with key information for share links
 */
export interface ZKEncryptionResult {
  encryptedPackage: ZKEncryptedPackage;
  keyData: {
    key: string; // Base64 encoded key for URL embedding
    salt: string; // Base64 encoded salt
    isPasswordDerived: boolean;
  };
}

/**
 * Share link data structure
 */
export interface ZKShareLinkData {
  shortUrl: string;
  key?: string; // Present for random key encryption
  password?: boolean; // True if password-derived key
}

/**
 * Browser compatibility check for required crypto features
 */
export function checkBrowserCompatibility(): {
  supported: boolean;
  missingFeatures: string[];
} {
  const missingFeatures: string[] = [];

  if (!globalThis.crypto) {
    missingFeatures.push('Web Crypto API');
  }

  if (!globalThis.crypto?.subtle) {
    missingFeatures.push('Web Crypto Subtle API');
  }

  if (!globalThis.TextEncoder) {
    missingFeatures.push('TextEncoder');
  }

  if (!globalThis.TextDecoder) {
    missingFeatures.push('TextDecoder');
  }

  return {
    supported: missingFeatures.length === 0,
    missingFeatures,
  };
}

/**
 * Generate a cryptographically secure random key
 */
export async function generateRandomKey(): Promise<CryptoKey> {
  const compatibility = checkBrowserCompatibility();
  if (!compatibility.supported) {
    throw new Error(
      `Browser not supported: ${compatibility.missingFeatures.join(', ')}`
    );
  }

  return await crypto.subtle.generateKey(
    {
      name: ZK_CONFIG.algorithm,
      length: ZK_CONFIG.keyLength,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive a key from password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const compatibility = checkBrowserCompatibility();
  if (!compatibility.supported) {
    throw new Error(
      `Browser not supported: ${compatibility.missingFeatures.join(', ')}`
    );
  }

  // Import password as key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive the actual encryption key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ZK_CONFIG.iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: ZK_CONFIG.algorithm,
      length: ZK_CONFIG.keyLength,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(ZK_CONFIG.saltLength));
}

/**
 * Generate a random IV
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(ZK_CONFIG.ivLength));
}

/**
 * Convert ArrayBuffer or Uint8Array to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt a file with client-side Zero-Knowledge encryption
 */
export async function encryptFileZK(
  file: File,
  password?: string
): Promise<ZKEncryptionResult> {
  const compatibility = checkBrowserCompatibility();
  if (!compatibility.supported) {
    throw new Error(
      `Browser not supported: ${compatibility.missingFeatures.join(', ')}`
    );
  }

  // Generate salt and IV
  const salt = generateSalt();
  const iv = generateIV();

  // Generate or derive encryption key
  let key: CryptoKey;
  let isPasswordDerived = false;

  if (password && password.trim()) {
    key = await deriveKeyFromPassword(password.trim(), salt);
    isPasswordDerived = true;
  } else {
    key = await generateRandomKey();
  }

  // Prepare file metadata
  const metadata: ZKFileMetadata = {
    filename: file.name,
    mimetype: file.type,
    size: file.size,
    timestamp: Date.now(),
  };

  // Read file content
  const fileContent = await file.arrayBuffer();

  // Combine metadata and file content
  const metadataString = JSON.stringify(metadata);
  const metadataBytes = new TextEncoder().encode(metadataString);

  // Create combined payload: [metadata length (4 bytes)][metadata][file content]
  const metadataLengthBytes = new Uint32Array([metadataBytes.length]);
  const combinedData = new Uint8Array(
    4 + metadataBytes.length + fileContent.byteLength
  );

  combinedData.set(new Uint8Array(metadataLengthBytes.buffer), 0);
  combinedData.set(metadataBytes, 4);
  combinedData.set(new Uint8Array(fileContent), 4 + metadataBytes.length);

  // Encrypt the combined data
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ZK_CONFIG.algorithm,
      iv: iv,
    },
    key,
    combinedData
  );

  // Export key for share link (if not password-derived)
  let exportedKey = '';
  if (!isPasswordDerived) {
    const keyBuffer = await crypto.subtle.exportKey('raw', key);
    exportedKey = arrayBufferToBase64(keyBuffer);
  } // Create the encrypted package
  const encryptedPackage: ZKEncryptedPackage = {
    encryptedData,
    publicMetadata: {
      size: encryptedData.byteLength,
      algorithm: ZK_CONFIG.algorithm,
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
      iterations: ZK_CONFIG.iterations,
      uploadTimestamp: Date.now(),
    },
  };

  return {
    encryptedPackage,
    keyData: {
      key: exportedKey,
      salt: arrayBufferToBase64(salt),
      isPasswordDerived,
    },
  };
}

/**
 * Decrypt a Zero-Knowledge encrypted file
 */
export async function decryptFileZK(
  encryptedPackage: ZKEncryptedPackage,
  keyOrPassword: string,
  isPassword: boolean = false
): Promise<{ file: Blob; metadata: ZKFileMetadata }> {
  const compatibility = checkBrowserCompatibility();
  if (!compatibility.supported) {
    throw new Error(
      `Browser not supported: ${compatibility.missingFeatures.join(', ')}`
    );
  }

  // Parse metadata
  const iv = new Uint8Array(
    base64ToArrayBuffer(encryptedPackage.publicMetadata.iv)
  );
  const salt = new Uint8Array(
    base64ToArrayBuffer(encryptedPackage.publicMetadata.salt)
  );

  // Derive or import the decryption key
  let key: CryptoKey;

  if (isPassword) {
    key = await deriveKeyFromPassword(keyOrPassword, salt);
  } else {
    // Import the key from base64
    const keyBuffer = base64ToArrayBuffer(keyOrPassword);
    key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: ZK_CONFIG.algorithm,
        length: ZK_CONFIG.keyLength,
      },
      false,
      ['decrypt']
    );
  }

  // Decrypt the data
  let decryptedData: ArrayBuffer;
  try {
    decryptedData = await crypto.subtle.decrypt(
      {
        name: ZK_CONFIG.algorithm,
        iv: iv,
      },
      key,
      encryptedPackage.encryptedData
    );
  } catch (error) {
    throw new Error('Decryption failed: Invalid key or corrupted data');
  }

  // Parse the decrypted data
  const decryptedBytes = new Uint8Array(decryptedData);

  // Read metadata length (first 4 bytes)
  const metadataLength = new Uint32Array(decryptedBytes.slice(0, 4).buffer)[0];

  // Extract metadata
  const metadataBytes = decryptedBytes.slice(4, 4 + metadataLength);
  const metadataString = new TextDecoder().decode(metadataBytes);
  const metadata: ZKFileMetadata = JSON.parse(metadataString);

  // Extract file content
  const fileContent = decryptedBytes.slice(4 + metadataLength);

  // Create blob with correct MIME type
  const file = new Blob([fileContent], { type: metadata.mimetype });

  return { file, metadata };
}

/**
 * Generate a share link with embedded key or password indicator
 */
export function generateZKShareLink(
  baseUrl: string,
  shortUrl: string,
  keyData: {
    key?: string;
    salt: string;
    isPasswordDerived: boolean;
  }
): string {
  const url = new URL(`${baseUrl}/s/${shortUrl}`);

  if (keyData.isPasswordDerived) {
    // For password-derived keys, add a flag to indicate password requirement
    url.hash = 'password';
  } else if (keyData.key) {
    // For random keys, embed the key in the URL fragment
    url.hash = `key=${keyData.key}`;
  } else {
    // Fallback - should not happen but handle gracefully
    throw new Error('Missing key for non-password-derived encryption');
  }

  return url.toString();
}

/**
 * Parse share link to extract key information
 */
export function parseZKShareLink(url: string): ZKShareLinkData {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  const shortUrl = pathParts[pathParts.length - 1];

  if (urlObj.hash === '#password') {
    return {
      shortUrl,
      password: true,
    };
  } else if (urlObj.hash.startsWith('#key=')) {
    return {
      shortUrl,
      key: urlObj.hash.substring(5), // Remove '#key='
    };
  } else {
    return {
      shortUrl,
    };
  }
}

/**
 * Estimate encryption overhead for UI display
 */
export function estimateEncryptionOverhead(originalSize: number): number {
  // Metadata overhead (roughly 200 bytes for JSON metadata)
  const metadataOverhead = 200;
  // Length prefix (4 bytes)
  const lengthOverhead = 4;
  // GCM tag (16 bytes)
  const tagOverhead = ZK_CONFIG.tagLength;

  return metadataOverhead + lengthOverhead + tagOverhead;
}

/**
 * Wipe sensitive data from memory (best effort)
 */
export function wipeSensitiveData(arrayBuffer: ArrayBuffer): void {
  if (arrayBuffer && arrayBuffer.byteLength > 0) {
    const view = new Uint8Array(arrayBuffer);
    view.fill(0);
  }
}

/**
 * Validate encrypted package structure
 */
export function validateZKEncryptedPackage(
  pkg: unknown
): pkg is ZKEncryptedPackage {
  if (!pkg || typeof pkg !== 'object') return false;

  const p = pkg as any;

  return (
    p.encryptedData instanceof ArrayBuffer &&
    p.publicMetadata &&
    typeof p.publicMetadata.size === 'number' &&
    typeof p.publicMetadata.algorithm === 'string' &&
    typeof p.publicMetadata.iv === 'string' &&
    typeof p.publicMetadata.salt === 'string' &&
    typeof p.publicMetadata.iterations === 'number' &&
    typeof p.publicMetadata.uploadTimestamp === 'number'
  );
}
