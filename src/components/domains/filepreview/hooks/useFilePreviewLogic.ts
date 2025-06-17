'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useFilePreview } from '@/hooks/useFilePreview';
import { useOrigin } from '@/hooks/useOrigin';
import { useClientDecryption } from '@/hooks/useClientDecryption';
import { toast } from 'sonner';
import type { ClientFileData } from '@/types';

export interface UseFilePreviewLogicReturn {
  // State
  fileInfo: ClientFileData | null;
  passwordRequired: boolean;
  password: string;
  passwordLoading: boolean;
  downloading: boolean;
  shortUrl: string;

  // TanStack Query states
  loading: boolean;
  error: Error | null;

  // Client-side decryption
  isDecrypting: boolean;
  decryptedBlobURL: string | null;
  decryptionError: string | null;
  hasDecryptionKey: boolean;

  // Handlers
  handlePasswordSubmit: (e: React.FormEvent) => Promise<void>;
  handleDownload: () => Promise<void>;
  handleDecryptedDownload: () => Promise<void>;
  copyShareLink: () => void;
  setPassword: (password: string) => void;
  refetch: () => void;
  decryptFileForPreview: () => Promise<void>;

  // Derived states
  isFileExpired: boolean;
}

export function useFilePreviewLogic(): UseFilePreviewLogicReturn {
  const params = useParams();
  const locale = useLocale();
  const origin = useOrigin();
  const shortUrl = params.shortUrl as string;

  // Client-side decryption hook
  const {
    isDecrypting,
    decryptedBlobURL,
    decryptionError,
    hasKey: hasDecryptionKey,
    decryptFile,
    downloadDecrypted,
    clearDecrypted,
  } = useClientDecryption();

  // Local state
  const [fileInfo, setFileInfo] = useState<ClientFileData | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // TanStack Query for file info
  const {
    data: response,
    isLoading: loading,
    error,
    refetch: fetchFileInfo,
  } = useFilePreview(shortUrl);

  // Handle the response data
  useEffect(() => {
    if (response?.success) {
      if (response.passwordRequired) {
        setPasswordRequired(true);
      } else {
        setFileInfo((response.fileInfo as unknown as ClientFileData) || null);
      }
    }
  }, [response]);

  // Password verification handler
  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!password.trim()) return;

      try {
        setPasswordLoading(true);

        const response = await fetch(`/${locale}/s/${shortUrl}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        const result = await response.json();

        if (result.success) {
          setPasswordRequired(false);
          setFileInfo(result.fileInfo);
          toast.success('Password verified successfully!');
        } else {
          toast.error(result.error || 'Invalid password');
        }
      } catch {
        toast.error('Failed to verify password');
      } finally {
        setPasswordLoading(false);
      }
    },
    [password, shortUrl, locale]
  );

  // File download handler
  const handleDownload = useCallback(async () => {
    try {
      setDownloading(true);

      // Create download URL with verification if needed
      const downloadUrl = passwordRequired
        ? `/${locale}/s/${shortUrl}?verified=${Date.now()}`
        : `/api/download/${shortUrl}`;

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileInfo?.originalName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started!');
    } catch {
      toast.error('Failed to start download');
    } finally {
      setDownloading(false);
    }
  }, [passwordRequired, shortUrl, fileInfo?.originalName, locale]); // Share link copy handler
  const copyShareLink = useCallback(() => {
    if (!origin) {
      toast.error('Unable to copy share link - origin not available');
      return;
    }

    // For Zero-Knowledge files, we cannot reconstruct the full share link with key
    // because the key is not stored on the server. The complete share link with key
    // is only available immediately after upload.
    const shareUrl = `${origin}/${locale}/s/${shortUrl}`;

    // Check if this might be a ZK file (URL doesn't contain the key)
    const urlFragment = window.location.hash;
    if (
      urlFragment &&
      (urlFragment.includes('#') || urlFragment === '#password')
    ) {
      // This is likely a ZK file with key in URL fragment
      const currentUrl = `${origin}${window.location.pathname}${window.location.hash}`;
      navigator.clipboard.writeText(currentUrl);
      toast.success('Complete share link copied to clipboard!');
    } else {
      // Legacy file or ZK file without key in current URL
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');

      // Warn user if this might not include the decryption key
      setTimeout(() => {
        toast.info(
          'Note: If this is an encrypted file, the key may not be included. Use the original upload link for complete access.'
        );
      }, 2000);
    }
  }, [locale, shortUrl, origin]);

  // Decrypt file for preview
  const decryptFileForPreview = useCallback(async () => {
    if (!fileInfo || !hasDecryptionKey) {
      toast.error('Missing file info or decryption key');
      return;
    }

    try {
      // Fetch the encrypted file data
      const response = await fetch(`/api/preview-file/${shortUrl}`);
      if (!response.ok) {
        throw new Error('Failed to fetch file data');
      }

      // Get encryption metadata from headers
      const metadata = {
        iv: response.headers.get('X-ZK-IV') || '',
        salt: response.headers.get('X-ZK-Salt') || '',
        algorithm: response.headers.get('X-ZK-Algorithm') || 'AES-GCM',
        iterations: parseInt(
          response.headers.get('X-ZK-Iterations') || '100000'
        ),
      };

      // Get encrypted data
      const encryptedData = await response.arrayBuffer();

      // Decrypt using client-side decryption
      await decryptFile(encryptedData, metadata, fileInfo.mimeType);
    } catch (error) {
      console.error('Failed to decrypt file for preview:', error);
      toast.error('Failed to decrypt file for preview');
    }
  }, [fileInfo, hasDecryptionKey, shortUrl, decryptFile]);

  // Download decrypted file
  const handleDecryptedDownload = useCallback(async () => {
    if (!fileInfo || !hasDecryptionKey) {
      toast.error('Missing file info or decryption key');
      return;
    }

    try {
      // Fetch the encrypted file data
      const response = await fetch(`/api/preview-file/${shortUrl}`);
      if (!response.ok) {
        throw new Error('Failed to fetch file data');
      }

      // Get encryption metadata from headers
      const metadata = {
        iv: response.headers.get('X-ZK-IV') || '',
        salt: response.headers.get('X-ZK-Salt') || '',
        algorithm: response.headers.get('X-ZK-Algorithm') || 'AES-GCM',
        iterations: parseInt(
          response.headers.get('X-ZK-Iterations') || '100000'
        ),
      };

      // Get encrypted data
      const encryptedData = await response.arrayBuffer();

      // Download decrypted file
      await downloadDecrypted(
        encryptedData,
        metadata,
        fileInfo.originalName,
        fileInfo.mimeType
      );
    } catch (error) {
      console.error('Failed to download decrypted file:', error);
      toast.error('Failed to download file');
    }
  }, [fileInfo, hasDecryptionKey, shortUrl, downloadDecrypted]);

  // Derived state for file expiration
  const isFileExpired = fileInfo?.expiresAt
    ? new Date() > new Date(fileInfo.expiresAt)
    : false;
  return {
    // State
    fileInfo,
    passwordRequired,
    password,
    passwordLoading,
    downloading,
    shortUrl,

    // TanStack Query states
    loading,
    error,

    // Client-side decryption
    isDecrypting,
    decryptedBlobURL,
    decryptionError,
    hasDecryptionKey,

    // Handlers
    handlePasswordSubmit,
    handleDownload,
    handleDecryptedDownload,
    copyShareLink,
    setPassword,
    refetch: fetchFileInfo,
    decryptFileForPreview,

    // Derived states
    isFileExpired,
  };
}
