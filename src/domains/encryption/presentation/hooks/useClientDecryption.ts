/**
 * 🔐 Client-Side Decryption Hook (Zero-Knowledge)
 * 
 * React hook for decrypting files in the browser using DDD architecture.
 * This hook enforces zero-knowledge patterns - the server never sees decryption keys.
 */

import { useState, useCallback, useMemo } from 'react';
import { EncryptionService } from '../../infrastructure/crypto/encryption.service';
import { EncryptionKey } from '../../domain/value-objects/EncryptionKey';
import { InitializationVector } from '../../domain/value-objects/InitializationVector';
import { EncryptedFile } from '../../domain/entities/encrypted-file.entity';

/**
 * Simple file type detection based on content
 */
function detectSimpleFileType(data: Uint8Array): { extension: string; mimeType: string } {
  if (data.length < 4) {
    return { extension: '.bin', mimeType: 'application/octet-stream' };
  }

  // Check for common file signatures
  if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) {
    return { extension: '.jpg', mimeType: 'image/jpeg' };
  }
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) {
    return { extension: '.png', mimeType: 'image/png' };
  }
  if (data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46) {
    return { extension: '.pdf', mimeType: 'application/pdf' };
  }
  if (data[0] === 0x50 && data[1] === 0x4B && (data[2] === 0x03 || data[2] === 0x05)) {
    return { extension: '.zip', mimeType: 'application/zip' };
  }

  // Check if it looks like text (simple heuristic)
  const sampleSize = Math.min(data.length, 512);
  let textBytes = 0;
  for (let i = 0; i < sampleSize; i++) {
    const byte = data[i];
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      textBytes++;
    }
  }
  
  if (textBytes / sampleSize > 0.8) {
    return { extension: '.txt', mimeType: 'text/plain' };
  }

  return { extension: '.bin', mimeType: 'application/octet-stream' };
}

// Decryption state for the UI
export interface DecryptionState {
  isDecrypting: boolean;
  progress: number; // 0-100
  error: string | null;
  result: { file: File; filename: string } | null;
}

// API response structure for encrypted file data
interface EncryptedFileData {
  fileId: string;
  encryptedBlob: string; // Base64 string from JSON API
  iv: string;
  size: number;
  expiresAt: string;
  remainingDownloads: number;
  downloadCount: number;
}

/**
 * Convert regular base64 string to Uint8Array (for IVs from API)
 */
function base64ToUint8Array(base64: string): Uint8Array {
  console.log('🔄 [base64ToUint8Array] Converting base64 to Uint8Array:', {
    input: base64,
    inputLength: base64?.length || 0
  });
  
  try {
    const binaryString = atob(base64);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    
    console.log('✅ [base64ToUint8Array] Conversion successful:', {
      outputLength: uint8Array.length
    });
    
    return uint8Array;
  } catch (error) {
    console.error('❌ [base64ToUint8Array] Conversion failed:', error);
    throw new Error(`Invalid base64 string: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert base64url string to Uint8Array (for encryption keys from URL fragments)
 */
function base64UrlToUint8Array(base64url: string): Uint8Array {
  console.log('🔄 [base64UrlToUint8Array] Converting base64url to Uint8Array:', {
    input: base64url,
    inputLength: base64url?.length || 0
  });
  
  try {
    // Convert base64url to regular base64
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const paddingNeeded = 4 - (base64.length % 4);
    if (paddingNeeded !== 4) {
      base64 += '='.repeat(paddingNeeded);
    }
    
    const result = base64ToUint8Array(base64);
    console.log('✅ [base64UrlToUint8Array] Conversion successful:', {
      outputLength: result.length
    });
    
    return result;
  } catch (error) {
    console.error('❌ [base64UrlToUint8Array] Conversion failed:', error);
    throw new Error(`Invalid base64url string: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function useClientDecryption() {
  const [state, setState] = useState<DecryptionState>({
    isDecrypting: false,
    progress: 0,
    error: null,
    result: null,
  });

  // Initialize encryption service (memoized to prevent recreation)
  const encryptionService = useMemo(() => new EncryptionService(), []);

  const reset = useCallback(() => {
    setState({
      isDecrypting: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Download and decrypt a file using zero-knowledge decryption with DDD architecture
   */
  const downloadAndDecrypt = useCallback(async (
    fileId: string,
    encryptionKeyString: string
  ): Promise<{ file: File; filename: string } | null> => {
    console.log('🔐 [useClientDecryption] ===== STARTING DDD DOWNLOAD AND DECRYPT =====');
    console.log('🔐 [useClientDecryption] Input parameters:', {
      fileId,
      encryptionKeyLength: encryptionKeyString?.length || 0,
      timestamp: new Date().toISOString()
    });

    setState(prev => ({
      ...prev,
      isDecrypting: true,
      progress: 0,
      error: null,
      result: null
    }));

    try {
      // Step 1: Fetch encrypted file data (includes IV and metadata)
      console.log('📡 [useClientDecryption] ===== PHASE 1: FETCH ENCRYPTED DATA =====');
      setState(prev => ({ ...prev, progress: 40 }));
      
      const downloadResponse = await fetch(`/api/download/${fileId}`);
      
      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        console.error('❌ [useClientDecryption] Download API error', {
          status: downloadResponse.status,
          statusText: downloadResponse.statusText,
          errorText
        });
        throw new Error(`Failed to download file: ${downloadResponse.status} ${downloadResponse.statusText}`);
      }

      const responseData = await downloadResponse.json();
      const encryptedFileData: EncryptedFileData = responseData.data;
      
      console.log('✅ [useClientDecryption] Encrypted data retrieved successfully', {
        encryptedBlobLength: encryptedFileData.encryptedBlob?.length || 0,
        ivPresent: !!encryptedFileData.iv,
        ivValue: encryptedFileData.iv,
        expectedSize: encryptedFileData.size
      });

      // Step 2: Convert data to proper formats for DDD layer
      console.log('🔄 [useClientDecryption] ===== PHASE 2: DATA CONVERSION =====');
      setState(prev => ({ ...prev, progress: 60 }));

      // Convert encrypted blob from base64 to bytes
      const encryptedData = base64ToUint8Array(encryptedFileData.encryptedBlob);
      console.log('🔄 [useClientDecryption] Encrypted blob converted', {
        originalLength: encryptedFileData.encryptedBlob.length,
        convertedLength: encryptedData.length
      });

      // Convert encryption key from base64url to EncryptionKey value object
      const keyBytes = base64UrlToUint8Array(encryptionKeyString);
      console.log('🔄 [useClientDecryption] Key bytes converted', {
        originalLength: encryptionKeyString.length,
        keyBytesLength: keyBytes.length,
        expectedLength: 32
      });

      if (keyBytes.length !== 32) {
        throw new Error(`Invalid key length: expected 32 bytes, got ${keyBytes.length} bytes`);
      }

      const encryptionKey = EncryptionKey.fromBytes(keyBytes);
      console.log('✅ [useClientDecryption] EncryptionKey value object created');

      // Convert IV from base64 to InitializationVector value object
      const ivBytes = base64ToUint8Array(encryptedFileData.iv);
      console.log('🔄 [useClientDecryption] IV bytes converted', {
        originalIv: encryptedFileData.iv,
        originalLength: encryptedFileData.iv.length,
        ivBytesLength: ivBytes.length,
        expectedLength: 12
      });

      if (ivBytes.length !== 12) {
        throw new Error(`Invalid IV length: expected 12 bytes, got ${ivBytes.length} bytes`);
      }

      const iv = InitializationVector.fromBytes(ivBytes);
      console.log('✅ [useClientDecryption] InitializationVector value object created');      // Step 3: Use EncryptedFile entity for decryption (same as upload)
      console.log('🛠️ [useClientDecryption] ===== PHASE 3: ENTITY DECRYPTION =====');
      setState(prev => ({ ...prev, progress: 80 }));
        // Create EncryptedFile entity from downloaded data
      const encryptedFile = EncryptedFile.fromStoredData(
        fileId,
        encryptedData,
        encryptedFileData.iv, // Pass IV as base64 string, not bytes
        encryptedData.length
      );
      
      console.log('✅ [useClientDecryption] EncryptedFile entity created');

      // Decrypt using the entity method (same as upload path)
      const decryptedFile = await encryptedFile.decrypt(encryptionKey);
      
      console.log('✅ [useClientDecryption] File decrypted successfully using entity method', {
        decryptedFileName: decryptedFile.name,
        decryptedFileSize: decryptedFile.size,
        decryptedFileType: decryptedFile.type
      });      // Step 4: Create File object with smart type detection
      console.log('📄 [useClientDecryption] ===== PHASE 4: FILE CREATION =====');
      setState(prev => ({ ...prev, progress: 90 }));
      
      // The entity's decrypt method returns a File object directly
      // We need to get the file data for type detection
      const fileBuffer = await decryptedFile.arrayBuffer();
      const contentBytes = new Uint8Array(fileBuffer);
      const detectedType = detectSimpleFileType(contentBytes);
      const smartFilename = `downloadhaven-${fileId}${detectedType.extension}`;
      
      console.log('🔍 [useClientDecryption] File type detected:', {
        originalFileName: decryptedFile.name,
        originalSize: decryptedFile.size,
        originalType: decryptedFile.type,
        detectedMimeType: detectedType.mimeType,
        detectedExtension: detectedType.extension,
        suggestedFilename: smartFilename
      });
      
      // Create a new File with the detected type and smart filename
      const file = new File(
        [fileBuffer],
        smartFilename,
        { 
          type: detectedType.mimeType
        }
      );

      console.log('✅ [useClientDecryption] File object created successfully', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });setState(prev => ({ ...prev, progress: 100 }));

      const result = { file, filename: smartFilename };

      setState(prev => ({
        ...prev,
        isDecrypting: false,
        result
      }));

      console.log('🎉 [useClientDecryption] ===== DDD DOWNLOAD AND DECRYPT COMPLETED =====');
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Decryption failed';
      
      console.error('❌ [useClientDecryption] ===== PROCESS FAILED =====');
      console.error('❌ [useClientDecryption] Error details:', {
        error: errorMessage,
        errorType: error?.constructor?.name || 'Unknown',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        fileId,
        encryptionKeyProvided: !!encryptionKeyString,
        timestamp: new Date().toISOString()
      });
      
      setState(prev => ({
        ...prev,
        isDecrypting: false,
        error: errorMessage,
      }));
      
      return null;
    }
  }, [encryptionService]);

  /**
   * Trigger browser download of a decrypted file
   */
  const triggerDownload = useCallback((file: File, filename?: string) => {
    console.log('⬇️ [useClientDecryption] Triggering browser download', {
      fileName: file.name,
      fileSize: file.size,
      customFilename: filename
    });

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ [useClientDecryption] Download triggered successfully');
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    downloadAndDecrypt,
    triggerDownload,
    reset,
    clearError,
  };
}
