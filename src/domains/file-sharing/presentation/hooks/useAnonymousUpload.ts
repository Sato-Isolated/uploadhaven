'use client';

import { useState } from 'react';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: {
    fileId: string;
    shareUrl: string;
    expiresAt: string;
    generatedPassword?: string; // Random password generated for protection
  } | null;
}

/**
 * Simple client-side file upload hook that calls API endpoints
 * No database imports - only API calls
 */
export function useAnonymousUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  }); const uploadFile = async (file: File, options?: {
    enablePasswordProtection?: boolean; // Option to enable random password protection
    ttlHours?: number;
    maxDownloads?: number; // Optional download limit
  }) => {
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      result: null,
    }); try {
      // Simulate encryption progress
      setUploadState(prev => ({ ...prev, progress: 30 }));

      // Generate random password if protection is enabled
      let generatedPassword: string | undefined;
      if (options?.enablePasswordProtection) {
        // Generate a secure random password (12 characters, alphanumeric + symbols)
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        generatedPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map(byte => characters[byte % characters.length])
          .join('');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      if (generatedPassword) {
        formData.append('password', generatedPassword);
      }

      if (options?.ttlHours) {
        formData.append('ttlHours', options.ttlHours.toString());
      }

      // Only add maxDownloads if it's specified (optional feature)
      if (options?.maxDownloads && options.maxDownloads > 0) {
        formData.append('maxDownloads', options.maxDownloads.toString());
      }

      setUploadState(prev => ({ ...prev, progress: 60 }));

      // Call API endpoint
      const response = await fetch('/api/zk-upload', {
        method: 'POST',
        body: formData,
      });

      setUploadState(prev => ({ ...prev, progress: 90 }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        result: {
          fileId: result.fileId,
          shareUrl: result.shareUrl,
          expiresAt: result.expiresAt,
          generatedPassword, // Include the generated password in the result
        },
      });

      return {
        ...result,
        generatedPassword, // Return the password so the UI can display it
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        result: null,
      });
      throw error;
    }
  };

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  };

  return {
    uploadFile,
    resetUpload,
    ...uploadState,
  };
}
