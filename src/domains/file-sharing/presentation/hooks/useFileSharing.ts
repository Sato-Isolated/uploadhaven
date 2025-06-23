/**
 * File Sharing Hook - React hook for anonymous file sharing operations
 * 
 * Provides a clean interface for uploading and sharing files anonymously.
 * Uses API endpoints instead of direct domain services for client safety.
 * 
 * @domain file-sharing
 * @pattern Presentation Hook (DDD)
 * @privacy zero-knowledge - all encryption happens client-side
 */

'use client';

import { useState, useCallback } from 'react';

// API response types
interface UploadAnonymousResponse {
  fileId: string;
  shareUrl: string;
  expiresAt: string;
}

interface DownloadFileResponse {
  fileId: string;
  filename: string;
  content: ArrayBuffer;
}

/**
 * Upload state management
 */
interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: UploadAnonymousResponse | null;
}

/**
 * Download state management
 */
interface DownloadState {
  isDownloading: boolean;
  progress: number;
  error: string | null;
  result: DownloadFileResponse | null;
}

/**
 * Main file sharing hook
 */
export function useFileSharing() {
  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  // Download state
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: 0,
    error: null,
    result: null,
  });

  /**
   * Upload a file anonymously using API endpoint (client-safe)
   */
  const uploadFile = useCallback(async (
    file: File,
    options?: {
      ttlHours?: number;
      maxDownloads?: number;
      password?: string;
    }
  ): Promise<UploadAnonymousResponse | null> => {
    try {
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
        result: null,
      });

      // Progress: Starting upload
      setUploadState(prev => ({ ...prev, progress: 10 }));

      // Call API endpoint instead of using server-side services
      const formData = new FormData();
      formData.append('file', file);
      if (options?.ttlHours) formData.append('ttlHours', options.ttlHours.toString());
      if (options?.maxDownloads) formData.append('maxDownloads', options.maxDownloads.toString());
      if (options?.password) formData.append('password', options.password);

      // Progress: Uploading
      setUploadState(prev => ({ ...prev, progress: 50 }));

      const response = await fetch('/api/zk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result: UploadAnonymousResponse = await response.json();

      // Progress: Complete
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        result,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }));
      console.error('Upload error:', error);
      return null;
    }
  }, []);

  /**
   * Download a file using API endpoint (client-safe)
   */
  const downloadFile = useCallback(async (fileId: string): Promise<DownloadFileResponse | null> => {
    try {
      setDownloadState({
        isDownloading: true,
        progress: 0,
        error: null,
        result: null,
      });

      // Progress: Starting download
      setDownloadState(prev => ({ ...prev, progress: 10 }));

      // Call API endpoint
      const response = await fetch(`/api/download/${fileId}`);

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Progress: Downloading
      setDownloadState(prev => ({ ...prev, progress: 50 }));

      const content = await response.arrayBuffer();

      const result: DownloadFileResponse = {
        fileId,
        filename: 'downloaded-file', // TODO: Get from response headers
        content,
      };

      // Progress: Complete
      setDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        progress: 100,
        result,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        error: errorMessage,
      }));
      console.error('Download error:', error);
      return null;
    }
  }, []);

  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  /**
   * Reset download state
   */
  const resetDownload = useCallback(() => {
    setDownloadState({
      isDownloading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  return {
    // Upload operations
    uploadFile,
    uploadState,
    resetUpload,
    isUploading: uploadState.isUploading,

    // Download operations
    downloadFile,
    downloadState,
    resetDownload,
    isDownloading: downloadState.isDownloading,
  };
}
