import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilePreview, useTextPreview } from '../useFilePreview';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    filePreview: vi.fn((url: string) => ['filePreview', url]),
    fileMetadata: vi.fn((shortUrl: string) => ['fileMetadata', shortUrl]),
  },
}));

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

describe('useTextPreview', () => {
  const mockUseQuery = {
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as any).mockReturnValue(mockUseQuery);
  });

  it('should call useQuery with correct parameters for text preview', () => {
    const url = 'https://example.com/file.txt';
    renderHook(() => useTextPreview(url));

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['filePreview', url],
      queryFn: expect.any(Function),
      enabled: true,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      retryDelay: expect.any(Function),
    });
  });

  it('should disable query when enabled is false', () => {
    const url = 'https://example.com/file.txt';
    renderHook(() => useTextPreview(url, { enabled: false }));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('should disable query when url is empty', () => {
    renderHook(() => useTextPreview(''));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('should handle text content fetching', async () => {
    const url = 'https://example.com/file.txt';
    const mockText = 'Sample text content';
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockText),
    });

    renderHook(() => useTextPreview(url));

    const queryCall = (useQuery as any).mock.calls[0][0];
    const result = await queryCall.queryFn();

    expect(global.fetch).toHaveBeenCalledWith(url, {
      method: 'GET',
      headers: {
        Accept: 'text/plain, text/html, text/markdown, text/*, */*',
      },
    });
    expect(result).toBe(mockText);
  });

  it('should handle fetch errors', async () => {
    const url = 'https://example.com/file.txt';
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    renderHook(() => useTextPreview(url));

    const queryCall = (useQuery as any).mock.calls[0][0];
    
    await expect(queryCall.queryFn()).rejects.toThrow(
      'Failed to fetch text content: Not Found'
    );
  });

  it('should calculate retry delay correctly', () => {
    renderHook(() => useTextPreview('https://example.com/file.txt'));

    const queryCall = (useQuery as any).mock.calls[0][0];
    const retryDelay = queryCall.retryDelay;

    expect(retryDelay(0)).toBe(1000); // 2^0 * 1000 = 1000
    expect(retryDelay(1)).toBe(2000); // 2^1 * 1000 = 2000
    expect(retryDelay(2)).toBe(4000); // 2^2 * 1000 = 4000
    expect(retryDelay(3)).toBe(5000); // Max 5000
  });

  it('should call queryKeys.filePreview with correct url', () => {
    const url = 'https://example.com/file.txt';
    renderHook(() => useTextPreview(url));

    expect(queryKeys.filePreview).toHaveBeenCalledWith(url);
  });
});

describe('useFilePreview', () => {
  const mockUseQuery = {
    data: undefined,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as any).mockReturnValue(mockUseQuery);
  });
  it('should call useQuery with correct parameters for file metadata', () => {
    const shortUrl = 'abc123';
    renderHook(() => useFilePreview(shortUrl));

    expect(useQuery).toHaveBeenCalledWith({
      queryKey: ['fileMetadata', shortUrl],
      queryFn: expect.any(Function),
      enabled: true,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: expect.any(Function),
    });
  });

  it('should disable query when enabled is false', () => {
    const shortUrl = 'abc123';
    renderHook(() => useFilePreview(shortUrl, { enabled: false }));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('should disable query when shortUrl is empty', () => {
    renderHook(() => useFilePreview(''));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('should handle file metadata fetching', async () => {
    const shortUrl = 'abc123';
    const mockResponse = {
      success: true,
      fileInfo: {
        name: 'test.txt',
        size: 1024,
        type: 'text/plain',
      },
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    renderHook(() => useFilePreview(shortUrl));

    const queryCall = (useQuery as any).mock.calls[0][0];
    const result = await queryCall.queryFn();

    expect(global.fetch).toHaveBeenCalledWith(`/api/preview/${shortUrl}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors', async () => {
    const shortUrl = 'abc123';
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'File not found',
    });

    renderHook(() => useFilePreview(shortUrl));

    const queryCall = (useQuery as any).mock.calls[0][0];
    
    await expect(queryCall.queryFn()).rejects.toThrow(
      'Failed to fetch file metadata: File not found'
    );
  });

  it('should handle password-required response', async () => {
    const shortUrl = 'abc123';
    const mockResponse = {
      success: false,
      passwordRequired: true,
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    renderHook(() => useFilePreview(shortUrl));

    const queryCall = (useQuery as any).mock.calls[0][0];
    const result = await queryCall.queryFn();

    expect(result).toEqual(mockResponse);
    expect(result.passwordRequired).toBe(true);
  });

  it('should handle error response', async () => {
    const shortUrl = 'abc123';
    const mockResponse = {
      success: false,
      error: 'File has expired',
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    renderHook(() => useFilePreview(shortUrl));

    const queryCall = (useQuery as any).mock.calls[0][0];
    const result = await queryCall.queryFn();

    expect(result).toEqual(mockResponse);
    expect(result.error).toBe('File has expired');
  });

  it('should call queryKeys.fileMetadata with correct shortUrl', () => {
    const shortUrl = 'abc123';
    renderHook(() => useFilePreview(shortUrl));

    expect(queryKeys.fileMetadata).toHaveBeenCalledWith(shortUrl);
  });

  it('should use different cache times for metadata vs text content', () => {
    const shortUrl = 'abc123';
    const textUrl = 'https://example.com/file.txt';

    renderHook(() => useFilePreview(shortUrl));
    const metadataCall = (useQuery as any).mock.calls[0][0];

    (useQuery as any).mockClear();

    renderHook(() => useTextPreview(textUrl));
    const textCall = (useQuery as any).mock.calls[0][0];

    // Metadata has shorter cache times (more dynamic)
    expect(metadataCall.staleTime).toBe(2 * 60 * 1000); // 2 minutes
    expect(metadataCall.gcTime).toBe(10 * 60 * 1000); // 10 minutes

    // Text content has longer cache times (more static)
    expect(textCall.staleTime).toBe(5 * 60 * 1000); // 5 minutes
    expect(textCall.gcTime).toBe(30 * 60 * 1000); // 30 minutes
  });
});
