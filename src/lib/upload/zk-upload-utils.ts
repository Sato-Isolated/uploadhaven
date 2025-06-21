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
        originalType: file.type,
        originalName: file.name,
      },
    };    console.log('🔐 ZK Upload preparing:', {
      originalFileSize: file.size,
      encryptedSize: encrypted.encryptedPackage.encryptedData.byteLength,
      metadataSize: encrypted.encryptedPackage.publicMetadata.size,
      base64Size: uploadData.encryptedData.length,
      // Test base64 round-trip (browser compatible)
      base64DecodeTest: (() => {
        // Browser-compatible base64 decode test
        try {
          const binaryString = atob(uploadData.encryptedData);
          return binaryString.length;
        } catch (e) {
          return 'decode-error';
        }
      })()
    });// Upload to true ZK endpoint
    const response = await fetch('/api/zk-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadData),
    });    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error('Upload API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json().catch(() => {
      throw new Error('Failed to parse success response');
    });    console.log('Upload API response:', result); // Debug log    // Validate that the result contains required data
    if (!result || !result.data?.url) {
      console.error('Invalid API response:', result);
      throw new Error('Invalid response: missing URL in data');
    }

    // Generate final share link with embedded key
    const shareUrl = generateZKShareLink(
      window.location.origin,
      result.data.url.split('/').pop() || '',
      encrypted.keyData
    );

    return {
      success: true,
      url: shareUrl,
      shortUrl: shareUrl,
      data: result,
    };  } catch (error) {
    console.error('ZK Upload failed:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    
    if (errorMessage.includes('size mismatch')) {
      return {
        success: false,
        error: 'File encryption error: size validation failed. Please try again.'
      };
    }
    
    if (errorMessage.includes('400')) {
      return {
        success: false,
        error: 'Upload validation failed. Please check your file and try again.'
      };
    }
    
    return {
      success: false,
      error: errorMessage,
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
