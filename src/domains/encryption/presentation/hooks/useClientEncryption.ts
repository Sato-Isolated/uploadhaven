/**
 * 🪝 useClientEncryption Hook
 * 
 * React hook for client-side file encryption/decryption.
 * Handles zero-knowledge patterns and UX states.
 */

import { useState, useCallback, useMemo } from 'react';
import { EncryptFileUseCase } from '../../application/usecases/encrypt-file.usecase';
import { DecryptFileUseCase } from '../../application/usecases/decrypt-file.usecase';
import { EncryptionService } from '../../infrastructure/crypto/encryption.service';
import { EncryptedFile } from '../../domain/entities/encrypted-file.entity';

export interface EncryptionState {
  isEncrypting: boolean;
  isDecrypting: boolean;
  progress: number;
  error: string | null;
  result: {
    shareUrl?: string;
    file?: File;
    metadata?: {
      originalSize: number;
      encryptedSize: number;
      algorithm: string;
      timestamp: Date;
    };
  } | null;
}

export interface FileMetadata {
  originalSize: number;
  algorithm: string;
  timestamp: Date;
}

interface UseClientEncryptionResult {
  state: EncryptionState;  encryptFile: (file: File, options?: {
    password?: string;
    baseUrl?: string;
    ttlHours?: number;
    maxDownloads?: number;
  }) => Promise<void>;
  decryptFromUrl: (shareUrl: string, encryptedBlob: Uint8Array, iv: Uint8Array, metadata: FileMetadata) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

/**
 * Hook for client-side encryption operations
 */
export function useClientEncryption(): UseClientEncryptionResult {
  const [state, setState] = useState<EncryptionState>({
    isEncrypting: false,
    isDecrypting: false,
    progress: 0,
    error: null,
    result: null
  });
  // Initialize services (memoized to prevent recreation on every render)
  const encryptionService = useMemo(() => new EncryptionService(), []);
  const encryptUseCase = useMemo(() => new EncryptFileUseCase(encryptionService), [encryptionService]);
  const decryptUseCase = useMemo(() => new DecryptFileUseCase(encryptionService), [encryptionService]);
  // Upload encrypted file to API
  const uploadEncryptedFile = async (encryptedFile: EncryptedFile, options: {
    ttlHours?: number;
    maxDownloads?: number;
    password?: string;
  }) => {
    // Convert encrypted file to base64 for API
    const encryptedData = Buffer.from(encryptedFile.encryptedBlob).toString('base64');
    const iv = Buffer.from(encryptedFile.iv).toString('base64');
    
    const payload = {
      encryptedData,
      metadata: {
        size: encryptedFile.encryptedSize,
        algorithm: encryptedFile.algorithm,
        iv: iv,
        salt: '', // Will be handled by encryption service
        iterations: 100000,
        uploadTimestamp: Date.now(),
      },      userOptions: {
        password: options.password,
        ttlHours: options.ttlHours || 24,
        maxDownloads: options.maxDownloads, // Only send if specified
        originalType: 'application/octet-stream', // We don't expose original type for privacy
        originalName: 'encrypted-file.bin', // We don't expose original name for privacy
      },
    };

    const response = await fetch('/api/zk-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }    const result = await response.json();
    
    // Extract data from the wrapped response structure
    const responseData = result.data || result; // Handle both wrapped and direct responses
    
    return responseData;
  };
  const encryptFile = useCallback(async (
    file: File,
    options: {
      password?: string;
      baseUrl?: string;
      ttlHours?: number;
      maxDownloads?: number;
    } = {}
  ) => {
    setState(prev => ({
      ...prev,
      isEncrypting: true,
      progress: 0,
      error: null,
      result: null
    }));

    try {
      // Simulate progress updates for UX
      setState(prev => ({ ...prev, progress: 0.2 }));

      const baseUrl = options.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://uploadhaven.dev');

      setState(prev => ({ ...prev, progress: 0.4 }));      const result = await encryptUseCase.execute({
        file,
        password: options.password,
        baseUrl
      });

      setState(prev => ({ ...prev, progress: 0.8 }));      // Now upload the encrypted file to the API with the user options
      const uploadResponse = await uploadEncryptedFile(result.encryptedFile, {
        ttlHours: options.ttlHours,
        maxDownloads: options.maxDownloads,
        password: options.password,
      });

      // The encryption use case already generated a complete share URL with key
      // We just need to replace the base URL with the server's URL for the file ID
      const encryptionKey = result.shareUrl.split('#')[1];
      const finalShareUrl = `${uploadResponse.shareUrl}#${encryptionKey}`;

      setState(prev => ({
        ...prev,
        isEncrypting: false,
        progress: 1,
        result: {
          shareUrl: finalShareUrl, // Complete URL with encryption key
          metadata: {
            originalSize: result.encryptedFile.originalSize,
            encryptedSize: result.encryptedFile.encryptedSize,
            algorithm: result.encryptedFile.algorithm,
            timestamp: result.encryptedFile.timestamp
          }
        }
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Encryption failed';
      setState(prev => ({
        ...prev,
        isEncrypting: false,
        progress: 0,
        error: errorMessage
      }));
    }
  }, [encryptUseCase]);

  const decryptFromUrl = useCallback(async (
    shareUrl: string,
    encryptedBlob: Uint8Array,
    iv: Uint8Array,
    metadata: {
      originalSize: number;
      algorithm: string;
      timestamp: Date;
    }
  ) => {
    setState(prev => ({
      ...prev,
      isDecrypting: true,
      progress: 0,
      error: null,
      result: null
    }));

    try {
      setState(prev => ({ ...prev, progress: 0.3 }));

      const result = await decryptUseCase.executeFromShareUrl({
        shareUrl,
        encryptedBlob,
        iv,
        metadata
      });

      setState(prev => ({ ...prev, progress: 0.8 }));

      setState(prev => ({
        ...prev,
        isDecrypting: false,
        progress: 1,
        result: {
          file: result.file,
          metadata: {
            originalSize: result.metadata.originalSize,
            encryptedSize: encryptedBlob.length,
            algorithm: result.metadata.algorithm,
            timestamp: result.metadata.timestamp
          }
        }
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Decryption failed';
      setState(prev => ({
        ...prev,
        isDecrypting: false,
        progress: 0,
        error: errorMessage
      }));
    }
  }, [decryptUseCase]);

  const reset = useCallback(() => {
    setState({
      isEncrypting: false,
      isDecrypting: false,
      progress: 0,
      error: null,
      result: null
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    encryptFile,
    decryptFromUrl,
    reset,
    clearError
  };
}
