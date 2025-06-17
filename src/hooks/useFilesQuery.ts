import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/core/queryKeys';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { uploadFileZK } from '@/lib/upload/zk-upload-utils';
import type { ClientFileData } from '@/types';

interface FilesResponse {
  files: ClientFileData[];
}

/**
 * Hook to fetch the list of files
 */
export function useFiles() {
  return useQuery({
    queryKey: queryKeys.files(),
    queryFn: async (): Promise<ClientFileData[]> => {
      const response = await ApiClient.get<FilesResponse>('/api/files');
      return response.files;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch a specific file
 */
export function useFile(id: string) {
  return useQuery({
    queryKey: queryKeys.file(id),
    queryFn: () => ApiClient.get<ClientFileData>(`/api/files/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to delete a single file with optimistic updates
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  const t = useTranslations('Query');

  return useMutation({
    mutationFn: (filename: string) =>
      ApiClient.delete(`/api/files/${filename}/delete`),
    onMutate: async (filename) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.files() });

      // Snapshot the previous value
      const previousFiles = queryClient.getQueryData<ClientFileData[]>(
        queryKeys.files()
      );

      // Optimistically update to the new value
      queryClient.setQueryData<ClientFileData[]>(
        queryKeys.files(),
        (old) => old?.filter((file) => file.name !== filename) ?? []
      );

      return { previousFiles };
    },

    onError: (err, variables, context) => {
      // If the mutation fails, roll back
      queryClient.setQueryData(queryKeys.files(), context?.previousFiles);
      toast.error(t('failedToDeleteFile'));
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics() });
    },

    onSuccess: () => {
      toast.success(t('fileDeletedSuccessfully'));
    },
  });
}

/**
 * Hook to delete multiple files with optimistic updates
 */
export function useDeleteFiles() {
  const queryClient = useQueryClient();
  const t = useTranslations('Query');

  return useMutation({
    mutationFn: (filenames: string[]) =>
      ApiClient.post('/api/bulk-delete', { filenames }),
    onMutate: async (filenames) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.files() });

      // Snapshot the previous value
      const previousFiles = queryClient.getQueryData<ClientFileData[]>(
        queryKeys.files()
      );

      // Optimistically update to the new value
      queryClient.setQueryData<ClientFileData[]>(
        queryKeys.files(),
        (old) => old?.filter((file) => !filenames.includes(file.name)) ?? []
      );

      return { previousFiles };
    },

    onError: (err, variables, context) => {
      // If the mutation fails, roll back
      queryClient.setQueryData(queryKeys.files(), context?.previousFiles);
      toast.error(t('failedToDeleteFiles'));
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.files() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics() });
    },

    onSuccess: (data, variables) => {
      toast.success(t('successfullyDeletedCount', { count: variables.length }));
    },
  });
}

/**
 * Hook for file upload
 */
export function useUploadFile() {
  const queryClient = useQueryClient();
  const t = useTranslations('Query');
  return useMutation<ClientFileData, Error, FormData>({
    mutationFn: async (formData: FormData): Promise<ClientFileData> => {
      // Extract file from FormData and use ZK upload
      const file = formData.get('file') as File;
      const expiration = formData.get('expiration') as string;
      const password = formData.get('password') as string;

      if (!file) {
        throw new Error('No file provided');
      }

      const result = await uploadFileZK(file, {
        expiration: expiration || undefined,
        password: password || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      return result.data as ClientFileData;
    },

    onSuccess: (data: ClientFileData) => {
      // Add the new file to the cache
      queryClient.setQueryData<ClientFileData[]>(queryKeys.files(), (old) => [
        data,
        ...(old ?? []),
      ]);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics() });

      toast.success(t('fileUploadedSuccessfully'));
    },

    onError: (error) => {
      toast.error(t('uploadFailedTryAgain'));
      console.error('Upload error:', error);
    },
  });
}
