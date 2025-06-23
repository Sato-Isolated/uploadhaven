/**
 * useClientDecryption Hook - Zero-Knowledge File Decryption
 * 
 * Provides client-side file decryption functionality using direct
 * Web Crypto API for simplified zero-knowledge decryption.
 * 
 * @domain encryption
 * @pattern Presentation Layer Hook (Clean Architecture)
 * @privacy zero-knowledge - decryption happens entirely on client
 */

'use client';

import { useState, useCallback } from 'react';

interface DecryptionState {
  isDecrypting: boolean;
  progress: number;
  error: string | null;
  result: {
    file: File;
    filename: string;
  } | null;
}

interface EncryptedFileData {
  fileId: string;
  encryptedBlob: number[]; // Array format from JSON API
  iv: string;
  size: number;
  expiresAt: string;
  remainingDownloads: number;
  downloadCount: number;
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const uint8Array = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }
  return uint8Array;
}

/**
 * Decrypt data using AES-256-GCM (Web Crypto API)
 */
async function decryptWithWebCrypto(
  encryptedData: Uint8Array, 
  key: CryptoKey, 
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encryptedData
  );
}

export function useClientDecryption() {
  const [state, setState] = useState<DecryptionState>({
    isDecrypting: false,
    progress: 0,
    error: null,
    result: null,
  });

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
   * Download and decrypt a file using zero-knowledge decryption
   */
  const downloadAndDecrypt = useCallback(async (
    fileId: string,
    encryptionKey: string,
    password?: string
  ): Promise<{ file: File; filename: string } | null> => {
    setState(prev => ({
      ...prev,
      isDecrypting: true,
      progress: 0,
      error: null,
      result: null
    }));

    try {
      // 1. Download encrypted file from API
      setState(prev => ({ ...prev, progress: 20 }));
      
      const response = await fetch(`/api/download/${fileId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Download failed');
      }

      const responseData = await response.json();
      const encryptedFileData: EncryptedFileData = responseData.data;

      setState(prev => ({ ...prev, progress: 40 }));

      // 2. Convert the array back to Uint8Array
      const encryptedBlob = new Uint8Array(encryptedFileData.encryptedBlob);
      const iv = base64ToUint8Array(encryptedFileData.iv);
      const keyBytes = base64ToUint8Array(encryptionKey);

      setState(prev => ({ ...prev, progress: 60 }));

      // 3. Import the encryption key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      setState(prev => ({ ...prev, progress: 70 }));

      // 4. Decrypt the file
      const decryptedBuffer = await decryptWithWebCrypto(
        encryptedBlob,
        cryptoKey,
        iv
      );

      setState(prev => ({ ...prev, progress: 90 }));

      // 5. Create a downloadable file with a proper name
      const filename = `decrypted-file-${fileId}.bin`; // We could enhance this later
      const file = new File([decryptedBuffer], filename, {
        type: 'application/octet-stream'
      });

      setState(prev => ({ ...prev, progress: 100 }));

      const result = { file, filename };

      setState(prev => ({
        ...prev,
        isDecrypting: false,
        result
      }));

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Decryption failed';
      setState(prev => ({
        ...prev,
        isDecrypting: false,
        error: errorMessage,
      }));
      
      console.error('Decryption error:', error);
      return null;
    }
  }, []);

  /**
   * Trigger browser download of a decrypted file
   */
  const triggerDownload = useCallback((file: File, filename: string) => {
    try {
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to trigger download:', error);
      throw new Error('Failed to download file');
    }
  }, []);

  return {
    // State
    state,
    isDecrypting: state.isDecrypting,
    progress: state.progress,
    error: state.error,
    result: state.result,

    // Actions
    downloadAndDecrypt,
    triggerDownload,
    reset,
    clearError,
  };
}
