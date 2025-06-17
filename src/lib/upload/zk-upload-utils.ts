/**
 * Upload utilities for Zero-Knowledge file encryption
 *
 * This module provides helper functions to upload files using the ZK encryption system.
 * All files are encrypted client-side before being sent to the server.
 */

import {
  createZKEncryptedBlob,
  generateEncryptionKey,
} from '@/lib/encryption/client-encryption';

/**
 * Interface for ZK upload options
 */
export interface ZKUploadOptions {
  password?: string;
  expiration?: string;
  autoGenerateKey?: boolean;
  requestEncryption?: boolean;
}

/**
 * Encrypt and upload a file using Zero-Knowledge encryption
 */
export async function uploadFileZK(
  file: File,
  options: ZKUploadOptions = {}
): Promise<{
  success: boolean;
  url?: string;
  shortUrl?: string;
  error?: string;
  data?: any;
}> {
  try {
    // Generate encryption key
    const encryptionKey = generateEncryptionKey(32);

    // Encrypt file client-side
    const encrypted = await createZKEncryptedBlob(file, encryptionKey);

    // Prepare form data with encrypted blob and ZK metadata
    const formData = new FormData();
    formData.append('file', encrypted.encryptedBlob, file.name);

    // Add ZK metadata
    formData.append('isZeroKnowledge', 'true');
    formData.append('zkEncryptionKey', encryptionKey);
    formData.append(
      'zkMetadata',
      JSON.stringify({
        iv: encrypted.metadata.iv,
        salt: encrypted.metadata.salt,
        iterations: encrypted.metadata.iterations.toString(),
        originalName: encrypted.metadata.originalName,
        originalType: encrypted.metadata.originalType,
        originalSize: encrypted.metadata.originalSize.toString(),
      })
    );

    // Add other options
    if (options.password) {
      formData.append('password', options.password);
    }
    if (options.autoGenerateKey) {
      formData.append('autoGenerateKey', 'true');
    }
    if (options.expiration) {
      formData.append('expiration', options.expiration);
    }
    if (options.requestEncryption !== undefined) {
      formData.append(
        'requestEncryption',
        options.requestEncryption.toString()
      );
    }

    // Upload to server
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();

    return {
      success: true,
      url: result.url,
      shortUrl: result.shortUrl,
      data: result,
    };
  } catch (error) {
    console.error('ZK Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Create FormData for ZK upload (for use with XMLHttpRequest)
 */
export async function createZKFormData(
  file: File,
  options: ZKUploadOptions = {}
): Promise<FormData> {
  // Generate encryption key
  const encryptionKey = generateEncryptionKey(32);

  // Encrypt file client-side
  const encrypted = await createZKEncryptedBlob(file, encryptionKey);

  // Prepare form data
  const formData = new FormData();
  formData.append('file', encrypted.encryptedBlob, file.name);

  // Add ZK metadata
  formData.append('isZeroKnowledge', 'true');
  formData.append('zkEncryptionKey', encryptionKey);
  formData.append(
    'zkMetadata',
    JSON.stringify({
      iv: encrypted.metadata.iv,
      salt: encrypted.metadata.salt,
      iterations: encrypted.metadata.iterations.toString(),
      originalName: encrypted.metadata.originalName,
      originalType: encrypted.metadata.originalType,
      originalSize: encrypted.metadata.originalSize.toString(),
    })
  );

  // Add other options
  if (options.password) {
    formData.append('password', options.password);
  }
  if (options.autoGenerateKey) {
    formData.append('autoGenerateKey', 'true');
  }
  if (options.expiration) {
    formData.append('expiration', options.expiration);
  }
  if (options.requestEncryption !== undefined) {
    formData.append('requestEncryption', options.requestEncryption.toString());
  }

  return formData;
}
