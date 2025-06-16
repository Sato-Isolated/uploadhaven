'use client';

import { renderHook, act } from '@testing-library/react';
import { useFileOperations } from '../useFileOperations';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestWrapper } from '../../__tests__/test-utils';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('useFileOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, file: 'test.txt' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const onSuccess = vi.fn();

      let uploadResult: any;
      await act(async () => {
        uploadResult = await result.current.uploadFile(file, { onSuccess });
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/upload',
        {
          method: 'POST',
          body: expect.any(FormData),
        }
      );
      expect(onSuccess).toHaveBeenCalledWith({
        success: true,
        file: 'test.txt',
      });
      expect(uploadResult).toEqual({ success: true, file: 'test.txt' });
    });
    it('should handle upload failure', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Upload failed' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });
      const onError = vi.fn();

      await act(async () => {
        try {
          await result.current.uploadFile(file, { onError });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(onError).toHaveBeenCalledWith('Upload failed');
    });
    it('should include optional parameters in upload', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      await act(async () => {
        await result.current.uploadFile(file, {
          expiration: '24h',
          password: 'secret',
          userId: 'user123',
        });
      });

      const formData = (global.fetch as any).mock.calls[0][1].body;
      expect(formData.get('expiration')).toBe('24h');
      expect(formData.get('password')).toBe('secret');
      expect(formData.get('userId')).toBe('user123');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      const onSuccess = vi.fn();

      let deleteResult: any;
      await act(async () => {
        deleteResult = await result.current.deleteFile('test.txt', {
          onSuccess,
        });
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bulk-delete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          body: JSON.stringify({
            filenames: ['test.txt'],
          }),
        }
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(deleteResult).toEqual({ success: true });
    });
    it('should handle delete failure', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Delete failed' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      const onError = vi.fn();

      await act(async () => {
        try {
          await result.current.deleteFile('test.txt', { onError });
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(onError).toHaveBeenCalledWith('Delete failed');
    });
  });

  describe('deleteMultipleFiles', () => {
    it('should delete multiple files successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({ success: true, deletedCount: 2 }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      const onSuccess = vi.fn();

      let deleteResult: any;
      await act(async () => {
        deleteResult = await result.current.deleteMultipleFiles(
          ['file1.txt', 'file2.txt'],
          { onSuccess }
        );
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/bulk-delete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          body: JSON.stringify({
            filenames: ['file1.txt', 'file2.txt'],
          }),
        }
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(deleteResult).toEqual({ success: true, deletedCount: 2 });
    });
  });

  describe('validateFile', () => {
    it('should validate allowed file types', () => {
      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      const validFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const validation = result.current.validateFile(validFile);

      expect(validation.valid).toBe(true);
      expect(validation.error).toBeUndefined();
    });
    it('should reject files that are too large', () => {
      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      // Create a mock file with size property (instead of creating actual large content)
      const largeFile = new File(['test'], 'large.txt', { type: 'text/plain' });
      Object.defineProperty(largeFile, 'size', {
        value: 101 * 1024 * 1024, // 101MB
        writable: false,
      });

      const validation = result.current.validateFile(largeFile);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('fileSizeMustBeLess');
    });
    it('should reject disallowed file types', () => {
      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      const invalidFile = new File(['test'], 'test.exe', {
        type: 'application/x-executable',
      });
      const validation = result.current.validateFile(invalidFile);

      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('fileTypeNotAllowedGeneric');
    });
  });

  describe('loading states', () => {
    it('should track uploading state', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          ),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      expect(result.current.uploading).toBe(false);

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      act(() => {
        result.current.uploadFile(file);
      });

      expect(result.current.uploading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.uploading).toBe(false);
    });

    it('should track deleting state', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          ),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);
      const { result } = renderHook(() => useFileOperations(), {
        wrapper: TestWrapper,
      });

      expect(result.current.deleting).toBe(false);

      act(() => {
        result.current.deleteFile('test.txt');
      });

      expect(result.current.deleting).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.deleting).toBe(false);
    });
  });
});
