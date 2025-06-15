'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/queryKeys';
import type { FileUploadOptions, FileDeleteOptions } from '@/types';

/**
 * Custom hook for file operations including upload, delete, and management.
 * Consolidates file handling logic used across FileUploader, AdminFileManager, etc.
 * Now uses TanStack Query for proper caching, state management, and invalidation.
 */
export function useFileOperations() {
  const t = useTranslations('Upload');
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // TanStack Query mutation for file upload
  const uploadFileMutation = useMutation({
    mutationFn: async (data: {
      file: File;
      options?: FileUploadOptions & {
        expiration?: string;
        password?: string;
        userId?: string;
      };
    }) => {
      const { file, options = {} } = data;
      const formData = new FormData();
      formData.append('file', file);

      if (options.expiration) {
        formData.append('expiration', options.expiration);
      }

      if (options.password) {
        formData.append('password', options.password);
      }

      if (options.userId) {
        formData.append('userId', options.userId);
      }

      return ApiClient.uploadFile('/api/upload', formData);
    },
    onSuccess: (result, variables) => {
      toast.success(t('fileUploadedSuccessfully'));
      variables.options?.onSuccess?.(result);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
    },
    onError: (error, variables) => {
      const errorMessage = error instanceof Error ? error.message : t('uploadFailed');
      toast.error(errorMessage);
      variables.options?.onError?.(errorMessage);
    },
    retry: 2,
    retryDelay: 1000,
  });

  // TanStack Query mutation for single file deletion
  const deleteFileMutation = useMutation({
    mutationFn: async (data: { filename: string; options?: FileDeleteOptions }) => {
      const { filename, options = {} } = data;
      return ApiClient.post('/api/bulk-delete', {
        filenames: [filename],
      });
    },
    onSuccess: (result, variables) => {
      toast.success(t('fileDeletedSuccessfully'));
      variables.options?.onSuccess?.();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
    },
    onError: (error, variables) => {
      const errorMessage = error instanceof Error ? error.message : t('deleteFailed');
      toast.error(errorMessage);
      variables.options?.onError?.(errorMessage);
    },
    retry: 2,
    retryDelay: 1000,
  });

  // TanStack Query mutation for multiple files deletion
  const deleteMultipleFilesMutation = useMutation({
    mutationFn: async (data: { filenames: string[]; options?: FileDeleteOptions }) => {
      const { filenames, options = {} } = data;
      return ApiClient.post<{ success: boolean; deletedCount: number }>('/api/bulk-delete', {
        filenames,
      });
    },
    onSuccess: (result, variables) => {
      toast.success(t('successfullyDeletedFiles', { count: result.deletedCount }));
      variables.options?.onSuccess?.();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
    },
    onError: (error, variables) => {
      const errorMessage = error instanceof Error ? error.message : t('bulkDeleteFailed');
      toast.error(errorMessage);
      variables.options?.onError?.(errorMessage);
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Wrapper functions that use the mutations
  const uploadFile = useCallback(
    async (
      file: File,
      options: FileUploadOptions & {
        expiration?: string;
        password?: string;
        userId?: string;
      } = {}
    ) => {
      setUploading(true);
      try {
        const result = await uploadFileMutation.mutateAsync({ file, options });
        return result;
      } finally {
        setUploading(false);
      }
    },
    [uploadFileMutation]
  );

  const deleteFile = useCallback(
    async (filename: string, options: FileDeleteOptions = {}) => {
      setDeleting(true);
      try {
        const result = await deleteFileMutation.mutateAsync({ filename, options });
        return result;
      } finally {
        setDeleting(false);
      }
    },
    [deleteFileMutation]
  );

  const deleteMultipleFiles = useCallback(
    async (filenames: string[], options: FileDeleteOptions = {}) => {
      setDeleting(true);
      try {
        const result = await deleteMultipleFilesMutation.mutateAsync({ filenames, options });
        return result;
      } finally {
        setDeleting(false);
      }
    },
    [deleteMultipleFilesMutation]
  );

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB
      const ALLOWED_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'application/pdf',
        'application/zip',
        'video/mp4',
        'audio/mpeg',
      ];

      if (file.size > MAX_SIZE) {
        return { valid: false, error: t('fileSizeMustBeLess') };
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: t('fileTypeNotAllowedGeneric') };
      }

      return { valid: true };
    },
    [t]
  );

  return {
    // Loading states (backward compatibility)
    uploading: uploading || uploadFileMutation.isPending,
    deleting: deleting || deleteFileMutation.isPending || deleteMultipleFilesMutation.isPending,
    
    // Core operations
    uploadFile,
    deleteFile,
    deleteMultipleFiles,
    validateFile,
    
    // Direct access to mutations for advanced usage
    uploadFileMutation,
    deleteFileMutation,
    deleteMultipleFilesMutation,
  };
}
