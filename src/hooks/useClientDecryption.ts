'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  extractKeyFromURL,
  hasDecryptionKey,
} from '@/lib/encryption/client-decryption';
import { 
  decryptFileZK, 
  ZKEncryptedPackage,
  safeBase64ToArrayBuffer,
  safeBase64UrlSafeToArrayBuffer
} from '@/lib/encryption/zero-knowledge';
import { toast } from 'sonner';

interface DecryptionMetadata {
  size: number;
  algorithm: string;
  iv: string;
  salt: string;
  iterations: number;
  uploadTimestamp: number;
}

export interface UseClientDecryptionReturn {
  // State
  isDecrypting: boolean;
  decryptedBlobURL: string | null;
  decryptionError: string | null;
  hasKey: boolean;
  decryptedMetadata: { filename: string; mimetype: string; size: number } | null; // Expose decrypted metadata
  // Actions
  decryptFile: (
    encryptedData: ArrayBuffer,
    metadata: DecryptionMetadata
  ) => Promise<void>;
  downloadDecrypted: (
    encryptedData: ArrayBuffer,
    metadata: DecryptionMetadata
  ) => Promise<void>;
  clearDecrypted: () => void;
}

export function useClientDecryption(): UseClientDecryptionReturn {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedBlobURL, setDecryptedBlobURL] = useState<string | null>(null);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [decryptedMetadata, setDecryptedMetadata] = useState<{ filename: string; mimetype: string; size: number } | null>(null);

  // Check for decryption key on mount and hash changes
  useEffect(() => {
    const checkKey = () => {
      setHasKey(hasDecryptionKey());
    };

    checkKey();

    // Listen for hash changes
    window.addEventListener('hashchange', checkKey);
    return () => window.removeEventListener('hashchange', checkKey);
  }, []);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (decryptedBlobURL) {
        URL.revokeObjectURL(decryptedBlobURL);
      }
    };
  }, [decryptedBlobURL]);

  const decryptFile = useCallback(
    async (encryptedData: ArrayBuffer, metadata: DecryptionMetadata) => {      const key = extractKeyFromURL();
      if (!key) {
        setDecryptionError('No decryption key found in URL');
        toast.error('No decryption key found in URL');
        return;
      }

      setIsDecrypting(true);
      setDecryptionError(null);
      
      try {
        // Validate metadata before creating encrypted package
        if (!metadata.iv || !metadata.salt) {
          throw new Error('Missing encryption metadata (IV or Salt)');
        }        // Test Base64 validation early
        try {
          safeBase64ToArrayBuffer(metadata.iv);
          safeBase64ToArrayBuffer(metadata.salt);
        } catch (base64Error) {
          throw new Error(`Invalid encryption metadata format: ${base64Error instanceof Error ? base64Error.message : 'Unknown'}`);
        }

        // Create ZK encrypted package from the data
        const encryptedPackage: ZKEncryptedPackage = {
          encryptedData,
          publicMetadata: metadata,
        };
        
        // Check if key is a password (starts with 'password')
        const isPassword = key === 'password';
        
        if (isPassword) {
          // For password-protected files, we need the user to enter the password
          setDecryptionError('Password required for this file');
          toast.error('Please enter the password for this file');
          return;
        }

        // Validate the key format (try URL-safe first, then regular Base64)
        try {
          safeBase64UrlSafeToArrayBuffer(key);
        } catch (urlSafeError) {
          console.warn('Key is not URL-safe Base64, this may be from an old file');          // Key might be from the URL fragment directly, which should be URL-safe
          throw new Error(`Invalid key format: ${urlSafeError instanceof Error ? urlSafeError.message : 'Unknown'}`);
        }
        
        // Decrypt using ZK system
        const { file, metadata: fileMetadata } = await decryptFileZK(
          encryptedPackage,
          key,
          false // not a password
        );

        // Clean up previous blob URL
        if (decryptedBlobURL) {
          URL.revokeObjectURL(decryptedBlobURL);
        }

        // Save decrypted metadata (including original filename)
        setDecryptedMetadata({
          filename: fileMetadata.filename,
          mimetype: fileMetadata.mimetype,
          size: fileMetadata.size,
        });

        // Create blob URL for preview
        const blobURL = URL.createObjectURL(file);
        setDecryptedBlobURL(blobURL);
        toast.success('File decrypted successfully');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Decryption failed';
        setDecryptionError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsDecrypting(false);
      }
    },
    [decryptedBlobURL]
  );  const downloadDecrypted = useCallback(    async (
      encryptedData: ArrayBuffer,
      metadata: DecryptionMetadata
    ) => {
      const key = extractKeyFromURL();
      if (!key) {
        toast.error('No decryption key found in URL');
        return;
      }

      setIsDecrypting(true);
      
      try {
        // Create ZK encrypted package from the data
        const encryptedPackage: ZKEncryptedPackage = {
          encryptedData,
          publicMetadata: metadata,
        };

        // Check if key is a password
        const isPassword = key === 'password';
        
        if (isPassword) {
          toast.error('Please enter the password for this file');
          return;
        }

        // Decrypt using ZK system
        const { file, metadata: fileMetadata } = await decryptFileZK(
          encryptedPackage,
          key,
          false // not a password
        );

        // Download the decrypted file
        const blob = new Blob([file], { type: fileMetadata.mimetype });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileMetadata.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        URL.revokeObjectURL(url);

        toast.success('File downloaded successfully');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Download failed';
        toast.error(errorMessage);
      } finally {
        setIsDecrypting(false);
      }
    },
    []
  );
  const clearDecrypted = useCallback(() => {
    if (decryptedBlobURL) {
      URL.revokeObjectURL(decryptedBlobURL);
      setDecryptedBlobURL(null);
    }
    setDecryptionError(null);
    setDecryptedMetadata(null);
  }, [decryptedBlobURL]);

  return {
    isDecrypting,
    decryptedBlobURL,
    decryptionError,
    hasKey,
    decryptedMetadata,
    decryptFile,
    downloadDecrypted,
    clearDecrypted,
  };
}
