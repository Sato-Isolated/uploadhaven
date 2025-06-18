/**
 * Upload utilities for Zero-Knowledge file encryption
 *
 * This module provides helper functions to upload files using the true ZK encryption system.
 * All files are encrypted client-side before being sent to the server.
 */

import {
  encryptFileZK,
  arrayBufferToBase64,
  generateZKShareLink,
  type ZKEncryptionResult,
} from '@/lib/encryption/zero-knowledge';

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
    // Encrypt file client-side using true ZK encryption
    const encrypted: ZKEncryptionResult = await encryptFileZK(
      file,
      options.password
    );    // Prepare upload data for /api/zk-upload
    const uploadData = {
      encryptedData: arrayBufferToBase64(encrypted.encryptedPackage.encryptedData),
      publicMetadata: {
        ...encrypted.encryptedPackage.publicMetadata,
        // Add content category for preview without revealing exact type
        contentCategory: getContentCategory(file.type),
      },
      keyData: encrypted.keyData,
      userOptions: {
        password: options.password,
        autoGenerateKey: options.autoGenerateKey,
        expiration: options.expiration || '24h',
      },
    };

    // Upload to true ZK endpoint
    const response = await fetch('/api/zk-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();

    // Generate final share link with embedded key
    const shareUrl = generateZKShareLink(
      window.location.origin,
      result.url.split('/').pop() || '',
      encrypted.keyData
    );

    return {
      success: true,
      url: shareUrl,
      shortUrl: shareUrl,
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
 * Create upload data for ZK upload (for use with fetch/XMLHttpRequest)
 * @deprecated This function creates data for the true ZK system, not FormData
 * Use uploadFileZK directly instead
 */
export async function createZKFormData(
  file: File,
  options: ZKUploadOptions = {}
): Promise<{
  uploadData: any;
  shareUrl: string;
}> {
  // Encrypt file client-side using true ZK encryption
  const encrypted: ZKEncryptionResult = await encryptFileZK(
    file,
    options.password
  );
  // Prepare upload data for /api/zk-upload
  const uploadData = {
    encryptedData: arrayBufferToBase64(encrypted.encryptedPackage.encryptedData),
    publicMetadata: {
      ...encrypted.encryptedPackage.publicMetadata,
      // Add content category for preview without revealing exact type
      contentCategory: getContentCategory(file.type),
    },
    keyData: encrypted.keyData,
    userOptions: {
      password: options.password,
      autoGenerateKey: options.autoGenerateKey,
      expiration: options.expiration || '24h',
    },
  };

  // Generate share URL (will need actual short URL after upload)
  const tempShareUrl = generateZKShareLink(
    window.location.origin,
    'temp-url', // Will be replaced with actual short URL
    encrypted.keyData
  );

  return {
    uploadData,
    shareUrl: tempShareUrl,
  };
}

// Helper to determine content category without revealing exact type
function getContentCategory(mimeType: string): 'media' | 'document' | 'archive' | 'text' | 'other' {
  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/') || mimeType.startsWith('image/')) {
    return 'media';
  }
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    return 'document';
  }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return 'archive';
  }
  if (mimeType.startsWith('text/')) {
    return 'text';
  }
  return 'other';
}
