import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginationParams, FileSearchFilters, PaginatedResult } from '@/domains/user/user-file-types';
import { useToast } from '@/components/ui/toast';

interface UseUserFilesParams {
  pagination: PaginationParams;
  filters?: FileSearchFilters;
}

export function useUserFiles({ pagination, filters }: UseUserFilesParams) {
  return useQuery({
    queryKey: ['user-files', pagination, filters],
    queryFn: async (): Promise<PaginatedResult<any>> => {
      const searchParams = new URLSearchParams();
      
      // Paramètres de pagination
      searchParams.append('page', pagination.page.toString());
      searchParams.append('limit', pagination.limit.toString());
      searchParams.append('sortBy', pagination.sortBy || 'createdAt');
      searchParams.append('sortOrder', pagination.sortOrder || 'desc');
      
      // Filtres de recherche
      if (filters?.name) searchParams.append('name', filters.name);
      if (filters?.status) searchParams.append('status', filters.status);
      if (filters?.mimeType) searchParams.append('mimeType', filters.mimeType);
      if (filters?.startDate) searchParams.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) searchParams.append('endDate', filters.endDate.toISOString());
      if (filters?.minSize) searchParams.append('minSize', filters.minSize.toString());
      if (filters?.maxSize) searchParams.append('maxSize', filters.maxSize.toString());
      
      const response = await fetch(`/api/user/files?${searchParams.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user files');
      }
      
      return response.json();
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  
  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/user/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete file');
      }
      
      return response.json();
    },
    onSuccess: (_, fileId) => {
      // Invalidate user files cache
      queryClient.invalidateQueries({ queryKey: ['user-files'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      
      addToast({
        type: 'success',
        title: 'File Deleted',
        message: 'Your file has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: error.message,
      });
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await fetch('/api/user/stats', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user stats');
      }
      
      return response.json();
    },
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook pour actions rapides sur les fichiers
export function useFileActions() {
  const { addToast } = useToast();
  
  const copyShareLink = async (shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast({
        type: 'success',
        title: 'Link Copied',
        message: 'Share URL has been copied to clipboard',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Failed to copy link to clipboard',
      });
    }
  };
  
  const downloadFile = (shareUrl: string) => {
    window.open(shareUrl, '_blank');
  };
  
  return {
    copyShareLink,
    downloadFile,
  };
}
