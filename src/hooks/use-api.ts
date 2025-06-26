import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { performanceMonitor } from '@/lib/performance';

// Optimized fetch function with retry logic
const optimizedFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        ...options?.headers,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Types
interface FileInfo {
  id: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  expiresAt: string;
  downloadCount: number;
  maxDownloads?: number;
  canBeDownloaded: boolean;
  passwordProtected: boolean;
}

interface UploadResult {
  fileId: string;
  shareUrl: string;
  expiresAt: string;
}

interface DownloadResult {
  fileName: string;
  mimeType: string;
  content: string; // base64
}

// Query Keys
export const queryKeys = {
  fileInfo: (shareId: string) => ['fileInfo', shareId] as const,
};

// Hook pour récupérer les informations d'un fichier
export function useFileInfo(shareId: string) {
  return useQuery({
    queryKey: queryKeys.fileInfo(shareId),
    queryFn: async (): Promise<FileInfo> => {
      const response = await optimizedFetch(`/api/share/${shareId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found or has expired');
        }
        throw new Error('Failed to load file information');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 secondes - info des fichiers change peu
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: (failureCount, error: Error) => {
      // Ne pas retry pour les 404
      if (error.message?.includes('not found')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Hook pour l'upload de fichier
export function useUploadFile() {
  return useMutation({
    mutationFn: async (formData: FormData): Promise<UploadResult> => {
      // Get file size for performance monitoring
      const file = formData.get('file') as File;
      const fileSize = file?.size || 0;

      return performanceMonitor.measureUpload(async () => {
        const response = await optimizedFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        return response.json();
      }, fileSize);
    },
    onSuccess: (data, variables) => {
      // Log successful upload performance
      const file = variables.get('file') as File;
      console.log(`Upload completed: ${file?.name} (${file?.size} bytes)`);
    },
    onError: (error, variables) => {
      // Log upload errors
      const file = variables.get('file') as File;
      console.error(`Upload failed: ${file?.name}`, error);
    },
  });
}

// Hook pour le téléchargement de fichier
export function useDownloadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, password }: { fileId: string; password?: string }): Promise<DownloadResult> => {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider les informations du fichier pour mettre à jour le compteur de téléchargements
      queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey[0] === 'fileInfo';
        },
      });
    },
  });
}

// Hook pour prefetch (pré-charger) les informations d'un fichier
export function usePrefetchFileInfo() {
  const queryClient = useQueryClient();

  return (shareId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.fileInfo(shareId),
      queryFn: async (): Promise<FileInfo> => {
        const response = await fetch(`/api/share/${shareId}`);
        if (!response.ok) {
          throw new Error('Failed to load file information');
        }
        return response.json();
      },
      staleTime: 30 * 1000,
    });
  };
}
