/**
 * Client-side Zero-Knowledge Encryption
 *
 * This module provides client-side encryption functions that work in the browser
 * for true Zero-Knowledge file sharing where the server never sees the decryption key.
 */

/**
 * Derive encryption key from password and salt using PBKDF2
 */
export async function deriveEncryptionKey(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import the password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive the encryption key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
}

/**
 * Encrypt file data using AES-GCM (client-side)
 */
export async function encryptFileData(
  fileData: ArrayBuffer,
  encryptionKey: string
): Promise<{
  encryptedData: ArrayBuffer;
  metadata: {
    iv: string;
    salt: string;
    iterations: number;
  };
}> {
  try {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
    const iv = crypto.getRandomValues(new Uint8Array(16)); // 128 bits
    const iterations = 100000;

    // Derive the encryption key
    const key = await deriveEncryptionKey(encryptionKey, salt, iterations);

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      fileData
    );
    return {
      encryptedData,
      metadata: {
        iv: btoa(String.fromCharCode(...iv)), // Convert to base64
        salt: btoa(String.fromCharCode(...salt)), // Convert to base64
        iterations,
      },
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt file data');
  }
}

/**
 * Create a ZK-encrypted blob for upload
 */
export async function createZKEncryptedBlob(
  file: File,
  encryptionKey: string
): Promise<{
  encryptedBlob: Blob;
  metadata: {
    iv: string;
    salt: string;
    iterations: number;
    originalName: string;
    originalType: string;
    originalSize: number;
  };
}> {
  // Read file as ArrayBuffer
  const fileData = await file.arrayBuffer();

  // Encrypt the file data
  const encryptionResult = await encryptFileData(fileData, encryptionKey);

  // Create blob from encrypted data
  const encryptedBlob = new Blob([encryptionResult.encryptedData], {
    type: 'application/octet-stream',
  });

  return {
    encryptedBlob,
    metadata: {
      ...encryptionResult.metadata,
      originalName: file.name,
      originalType: file.type,
      originalSize: file.size,
    },
  };
}

/**
 * Utility to convert binary string to base64 (for metadata)
 */
export function binaryToBase64(binaryString: string): string {
  return btoa(binaryString);
}

/**
 * Utility to generate a secure encryption key
 */
export function generateEncryptionKey(length: number = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const randomArray = crypto.getRandomValues(new Uint8Array(length));

  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }

  return result;
}
