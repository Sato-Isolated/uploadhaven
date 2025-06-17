'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  extractKeyFromURL,
  decryptFileForPreview,
  hasDecryptionKey,
  downloadDecryptedFile,
} from '@/lib/encryption/client-decryption';
import { toast } from 'sonner';

export interface UseClientDecryptionReturn {
  // State
  isDecrypting: boolean;
  decryptedBlobURL: string | null;
  decryptionError: string | null;
  hasKey: boolean;

  // Actions
  decryptFile: (
    encryptedData: ArrayBuffer,
    metadata: any,
    mimeType: string
  ) => Promise<void>;
  downloadDecrypted: (
    encryptedData: ArrayBuffer,
    metadata: any,
    filename: string,
    mimeType: string
  ) => Promise<void>;
  clearDecrypted: () => void;
}

export function useClientDecryption(): UseClientDecryptionReturn {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedBlobURL, setDecryptedBlobURL] = useState<string | null>(null);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);

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
    async (encryptedData: ArrayBuffer, metadata: any, mimeType: string) => {
      const key = extractKeyFromURL();
      if (!key) {
        setDecryptionError('No decryption key found in URL');
        toast.error('No decryption key found in URL');
        return;
      }

      setIsDecrypting(true);
      setDecryptionError(null);

      try {
        const { blobURL } = await decryptFileForPreview(
          encryptedData,
          key,
          metadata,
          mimeType
        );

        // Clean up previous blob URL
        if (decryptedBlobURL) {
          URL.revokeObjectURL(decryptedBlobURL);
        }

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
  );

  const downloadDecrypted = useCallback(
    async (
      encryptedData: ArrayBuffer,
      metadata: any,
      filename: string,
      mimeType: string
    ) => {
      const key = extractKeyFromURL();
      if (!key) {
        toast.error('No decryption key found in URL');
        return;
      }

      setIsDecrypting(true);

      try {
        const { decryptedData } = await decryptFileForPreview(
          encryptedData,
          key,
          metadata,
          mimeType
        );

        downloadDecryptedFile(decryptedData, filename, mimeType);
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
  }, [decryptedBlobURL]);

  return {
    isDecrypting,
    decryptedBlobURL,
    decryptionError,
    hasKey,
    decryptFile,
    downloadDecrypted,
    clearDecrypted,
  };
}
