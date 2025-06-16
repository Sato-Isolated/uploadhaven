import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDashboardUpload } from '../useDashboardUpload';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}));

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-id'),
}));

vi.mock('@/components/domains/upload/fileuploader/utils', () => ({
  getFileType: vi.fn(() => 'document'),
  saveFileToLocalStorage: vi.fn(),
}));

vi.mock('@/lib/security', () => ({
  scanFile: vi.fn(),
  logSecurityEvent: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  validateFileAdvanced: vi.fn(),
}));

import { useTranslations } from 'next-intl';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { scanFile } from '@/lib/security';
import { validateFileAdvanced } from '@/lib/utils';

describe('useDashboardUpload', () => {
  const mockT = vi.fn((key: string) => key);
  const mockSession = {
    data: { user: { id: 'user123' } },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTranslations as any).mockReturnValue(mockT);
    (useSession as any).mockReturnValue(mockSession);
    (validateFileAdvanced as any).mockResolvedValue({
      isValid: true,
      errors: [],
    });
    (scanFile as any).mockResolvedValue({ safe: true });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDashboardUpload());

    expect(result.current.files).toEqual([]);
    expect(result.current.expiration).toBe('24h');
    expect(result.current.isPasswordProtected).toBe(false);
    expect(result.current.showSettings).toBe(false);
  });

  it('should provide required action functions', () => {
    const { result } = renderHook(() => useDashboardUpload());

    expect(typeof result.current.processFiles).toBe('function');
    expect(typeof result.current.removeFile).toBe('function');
    expect(typeof result.current.clearCompleted).toBe('function');
    expect(typeof result.current.toggleSettings).toBe('function');
    expect(typeof result.current.setExpiration).toBe('function');
    expect(typeof result.current.setIsPasswordProtected).toBe('function');
  });

  it('should update expiration setting', () => {
    const { result } = renderHook(() => useDashboardUpload());

    act(() => {
      result.current.setExpiration('7d');
    });

    expect(result.current.expiration).toBe('7d');
  });

  it('should toggle password protection setting', () => {
    const { result } = renderHook(() => useDashboardUpload());

    expect(result.current.isPasswordProtected).toBe(false);

    act(() => {
      result.current.setIsPasswordProtected(true);
    });

    expect(result.current.isPasswordProtected).toBe(true);
  });

  it('should toggle settings visibility', () => {
    const { result } = renderHook(() => useDashboardUpload());

    expect(result.current.showSettings).toBe(false);

    act(() => {
      result.current.toggleSettings();
    });

    expect(result.current.showSettings).toBe(true);

    act(() => {
      result.current.toggleSettings();
    });

    expect(result.current.showSettings).toBe(false);
  });

  it('should remove files by id', () => {
    const { result } = renderHook(() => useDashboardUpload());

    // Mock initial files state
    act(() => {
      result.current.files.push({
        id: 'file-1',
        file: new File(['content'], 'test.txt'),
        progress: 0,
        status: 'uploading',
      });
      result.current.files.push({
        id: 'file-2',
        file: new File(['content'], 'test2.txt'),
        progress: 100,
        status: 'completed',
      });
    });

    act(() => {
      result.current.removeFile('file-1');
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].id).toBe('file-2');
  });

  it('should clear completed files', () => {
    const { result } = renderHook(() => useDashboardUpload());

    // Add mock files with different statuses
    const files = [
      {
        id: 'file-1',
        file: new File(['content'], 'test1.txt'),
        progress: 100,
        status: 'completed' as const,
      },
      {
        id: 'file-2',
        file: new File(['content'], 'test2.txt'),
        progress: 50,
        status: 'uploading' as const,
      },
      {
        id: 'file-3',
        file: new File(['content'], 'test3.txt'),
        progress: 100,
        status: 'completed' as const,
      },
    ];

    // Simulate files being in state
    result.current.files.splice(0, result.current.files.length, ...files);

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].status).toBe('uploading');
  });

  describe('file validation', () => {
    it('should reject files that are too large', async () => {
      const { result } = renderHook(() => useDashboardUpload());

      // Create a mock file with size property (instead of creating actual large content)
      const largeFile = new File(['test'], 'large.txt', { type: 'text/plain' });
      Object.defineProperty(largeFile, 'size', {
        value: 101 * 1024 * 1024, // 101MB
        writable: false,
      });

      await act(async () => {
        await result.current.processFiles([largeFile]);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('fileTooLarge')
      );
      expect(result.current.files).toHaveLength(0);
    });

    it('should reject files with disallowed types', async () => {
      const { result } = renderHook(() => useDashboardUpload());

      const executableFile = new File(['content'], 'malware.exe', {
        type: 'application/x-msdownload',
      });

      await act(async () => {
        await result.current.processFiles([executableFile]);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('fileTypeNotAllowed')
      );
      expect(result.current.files).toHaveLength(0);
    });

    it('should reject files that fail advanced validation', async () => {
      (validateFileAdvanced as any).mockResolvedValue({
        isValid: false,
        errors: ['File is corrupted'],
      });

      const { result } = renderHook(() => useDashboardUpload());

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        await result.current.processFiles([file]);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('fileFailedValidation')
      );
      expect(result.current.files).toHaveLength(0);
    });
  });

  describe('security scanning', () => {
    it('should handle files with security threats', async () => {
      (scanFile as any).mockResolvedValue({
        safe: false,
        threat: 'Malware detected',
      });

      const { result } = renderHook(() => useDashboardUpload());

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        await result.current.processFiles([file]);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].status).toBe('threat_detected');
      expect(result.current.files[0].error).toContain('securityThreatDetected');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('securityThreatInFile')
      );
    });

    it('should handle security scan failures', async () => {
      (scanFile as any).mockRejectedValue(new Error('Scan failed'));

      const { result } = renderHook(() => useDashboardUpload());

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        await result.current.processFiles([file]);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].status).toBe('error');
      expect(result.current.files[0].error).toBe('securityScanFailed');
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('failedToScanFile')
      );
    });
  });

  it('should handle successful file processing and start upload', async () => {
    const { result } = renderHook(() => useDashboardUpload());

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await result.current.processFiles([file]);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].status).toBe('uploading');
    expect(result.current.files[0].id).toBe('mock-id');
  });

  it('should maintain consistent interface structure', () => {
    const { result } = renderHook(() => useDashboardUpload());

    // Check state properties
    expect(Array.isArray(result.current.files)).toBe(true);
    expect(typeof result.current.expiration).toBe('string');
    expect(typeof result.current.isPasswordProtected).toBe('boolean');
    expect(typeof result.current.showSettings).toBe('boolean');

    // Check action functions
    expect(typeof result.current.processFiles).toBe('function');
    expect(typeof result.current.removeFile).toBe('function');
    expect(typeof result.current.clearCompleted).toBe('function');
    expect(typeof result.current.toggleSettings).toBe('function');
    expect(typeof result.current.setExpiration).toBe('function');
    expect(typeof result.current.setIsPasswordProtected).toBe('function');
  });
});
