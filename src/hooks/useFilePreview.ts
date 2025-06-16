import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/core/queryKeys';
import type { FileData } from '@/types';

interface UseTextPreviewOptions {
  enabled?: boolean;
}

interface FilePreviewResponse {
  success: boolean;
  passwordRequired?: boolean;
  fileInfo?: FileData;
  error?: string;
}

/**
 * Hook for fetching text content from a URL
 * Used for text file previews
 */
export function useTextPreview(
  url: string,
  options: UseTextPreviewOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.filePreview(url),
    queryFn: async (): Promise<string> => {
      console.log('🔍 useTextPreview - Fetching from URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'text/plain, text/html, text/markdown, text/*, */*',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch text content: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(
        '📄 useTextPreview - Content preview:',
        text.substring(0, 100) + (text.length > 100 ? '...' : '')
      );
      console.log('📊 useTextPreview - Content length:', text.length);

      return text;
    },
    enabled: enabled && !!url,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

/**
 * Hook for fetching file metadata for previews
 */
export function useFilePreview(
  shortUrl: string,
  options: UseTextPreviewOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.fileMetadata(shortUrl),
    queryFn: async (): Promise<FilePreviewResponse> => {
      const response = await fetch(`/api/preview/${shortUrl}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch file metadata: ${response.statusText}`
        );
      }

      return response.json();
    },
    enabled: enabled && !!shortUrl,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
