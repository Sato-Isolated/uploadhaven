'use client';

/**
 * Client-side decryption utilities for Zero-Knowledge file handling
 * These functions run entirely in the browser and never send keys to the server
 */

/**
 * Extract encryption key from URL fragment
 */
export function extractKeyFromURL(): string | null {
  if (typeof window === 'undefined') return null;

  const fragment = window.location.hash;
  if (!fragment || fragment.length <= 1) return null;

  // Remove the # and return the key
  return fragment.substring(1);
}

/**
 * Derive encryption key from the URL key using PBKDF2
 */
async function deriveEncryptionKey(
  urlKey: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(urlKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

/**
 * Decrypt file data using AES-GCM
 */
export async function decryptFileData(
  encryptedData: ArrayBuffer,
  urlKey: string,
  metadata: {
    iv: string;
    salt: string;
    tag?: string;
    iterations?: number;
  }
): Promise<ArrayBuffer> {
  try {
    // Convert base64 strings to Uint8Arrays (browser-compatible)
    const iv = new Uint8Array(
      atob(metadata.iv)
        .split('')
        .map((char) => char.charCodeAt(0))
    );
    const salt = new Uint8Array(
      atob(metadata.salt)
        .split('')
        .map((char) => char.charCodeAt(0))
    );
    const iterations = metadata.iterations || 100000;

    // Derive the encryption key
    const key = await deriveEncryptionKey(urlKey, salt, iterations);

    // For AES-GCM, the tag is included in the encrypted data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );

    return decryptedData;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Failed to decrypt file data');
  }
}

/**
 * Create blob URL from decrypted data
 */
export function createBlobURL(data: ArrayBuffer, mimeType: string): string {
  const blob = new Blob([data], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Download decrypted file
 */
export function downloadDecryptedFile(
  data: ArrayBuffer,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL
  URL.revokeObjectURL(url);
}

/**
 * Check if the current page has a decryption key in the URL
 */
export function hasDecryptionKey(): boolean {
  return extractKeyFromURL() !== null;
}

/**
 * Decrypt and prepare file for preview
 */
export async function decryptFileForPreview(
  encryptedData: ArrayBuffer,
  urlKey: string,
  metadata: {
    iv: string;
    salt: string;
    tag?: string;
    iterations?: number;
  },
  mimeType: string
): Promise<{
  decryptedData: ArrayBuffer;
  blobURL: string;
}> {
  const decryptedData = await decryptFileData(encryptedData, urlKey, metadata);
  const blobURL = createBlobURL(decryptedData, mimeType);

  return {
    decryptedData,
    blobURL,
  };
}
