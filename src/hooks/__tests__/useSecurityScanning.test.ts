import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSecurityScanning } from '../useSecurityScanning';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/security', () => ({
  detectSuspiciousActivity: vi.fn(() => false),
  logSecurityEvent: vi.fn(),
  scanFile: vi.fn(),
}));

import { toast } from 'sonner';

// Mock global fetch
global.fetch = vi.fn();

describe('useSecurityScanning', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSecurityScanning());

    expect(result.current.isScanning).toBe(false);
    expect(result.current.scanProgress).toBe(0);
    expect(result.current.selectedScanType).toBe('quick');
    expect(result.current.scanResults).toEqual([]);
    expect(result.current.currentScanStep).toBe('');
    expect(result.current.scannedFiles).toEqual([]);
    expect(result.current.totalFilesToScan).toBe(0);
    expect(result.current.currentFileIndex).toBe(0);
    expect(result.current.virusTotalRequestsUsed).toBe(0);
  });

  it('should provide all required interface methods', () => {
    const { result } = renderHook(() => useSecurityScanning());

    expect(typeof result.current.setSelectedScanType).toBe('function');
    expect(typeof result.current.startScan).toBe('function');
    expect(typeof result.current.stopScan).toBe('function');
    expect(typeof result.current.scanSingleFile).toBe('function');
    expect(typeof result.current.scanUploadedFile).toBe('function');
    expect(typeof result.current.fetchFilesList).toBe('function');
    expect(typeof result.current.resetScan).toBe('function');
  });

  it('should update selected scan type', () => {
    const { result } = renderHook(() => useSecurityScanning());

    act(() => {
      result.current.setSelectedScanType('full');
    });

    expect(result.current.selectedScanType).toBe('full');
  });

  it('should reset scan state', () => {
    const { result } = renderHook(() => useSecurityScanning());    // Set some state first
    act(() => {
      result.current.setSelectedScanType('full');
    });

    act(() => {
      result.current.resetScan();
    });

    expect(result.current.isScanning).toBe(false);
    expect(result.current.scanProgress).toBe(0);
    expect(result.current.selectedScanType).toBe('quick');
    expect(result.current.scanResults).toEqual([]);
    expect(result.current.currentScanStep).toBe('');
    expect(result.current.scannedFiles).toEqual([]);
    expect(result.current.totalFilesToScan).toBe(0);
    expect(result.current.currentFileIndex).toBe(0);
    expect(result.current.virusTotalRequestsUsed).toBe(0);
  });

  describe('fetchFilesList', () => {
    it('should fetch files list successfully', async () => {
      const mockFiles = { files: [{ name: 'test1.txt' }, { name: 'test2.jpg' }] };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFiles),
      });

      const { result } = renderHook(() => useSecurityScanning());

      await act(async () => {
        const response = await result.current.fetchFilesList();
        expect(response).toEqual(mockFiles);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/security/files');
    });

    it('should handle fetch files list error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useSecurityScanning());

      await act(async () => {
        await expect(result.current.fetchFilesList()).rejects.toThrow(
          'Failed to fetch files list'
        );
      });
    });
  });

  describe('scanSingleFile', () => {
    it('should scan a single file successfully', async () => {
      const mockScanResult = { 
        scanResult: { 
          safe: true, 
          threat: null, 
          scannedAt: new Date().toISOString() 
        } 
      };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockScanResult),
      });

      const { result } = renderHook(() => useSecurityScanning());

      await act(async () => {
        const response = await result.current.scanSingleFile('test.txt');
        expect(response).toEqual(mockScanResult);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/security/scan/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileName: 'test.txt' }),
      });
    });

    it('should handle single file scan error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useSecurityScanning());

      await act(async () => {
        await expect(result.current.scanSingleFile('test.txt')).rejects.toThrow(
          'Failed to scan file'
        );
      });
    });
  });

  describe('scanUploadedFile', () => {
    it('should scan an uploaded file successfully', async () => {
      const mockScanResult = { 
        scanResult: { 
          safe: true, 
          threat: null 
        },
        quotaStatus: { 
          used: 1, 
          limit: 500 
        }
      };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockScanResult),
      });

      const { result } = renderHook(() => useSecurityScanning());
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        const response = await result.current.scanUploadedFile(file);
        expect(response).toEqual(mockScanResult);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/security/scan', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });

    it('should handle uploaded file scan error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useSecurityScanning());
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        await expect(result.current.scanUploadedFile(file)).rejects.toThrow(
          'File scan failed'
        );
      });
    });

    it('should create FormData correctly for file upload', async () => {
      const mockScanResult = { scanResult: { safe: true } };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockScanResult),
      });

      const { result } = renderHook(() => useSecurityScanning());
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        await result.current.scanUploadedFile(file);
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const formData = fetchCall[1].body;
      
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get('file')).toBe(file);
    });
  });
  describe('startScan', () => {    it('should not start scan if already scanning', async () => {
      const { result } = renderHook(() => useSecurityScanning());

      // Start first scan
      act(() => {
        result.current.startScan();
      });

      // Try to start another scan immediately
      act(() => {
        result.current.startScan();
      });

      // Should be scanning (first scan should be active)
      expect(result.current.isScanning).toBe(true);
    });it('should set scanning state when starting', () => {
      const { result } = renderHook(() => useSecurityScanning());

      // Mock successful files fetch
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      });

      // Start scan without waiting for completion
      act(() => {
        result.current.startScan();
      });

      // Should immediately set scanning to true
      expect(result.current.isScanning).toBe(true);
    });
  });

  describe('stopScan', () => {
    it('should stop scanning and reset progress', () => {
      const { result } = renderHook(() => useSecurityScanning());

      act(() => {
        result.current.stopScan();
      });

      expect(result.current.isScanning).toBe(false);
      expect(result.current.scanProgress).toBe(0);
      expect(result.current.currentScanStep).toBe('');
    });  });

  it('should maintain correct state structure', () => {
    const { result } = renderHook(() => useSecurityScanning());

    // Verify hook rendered properly
    expect(result.current).not.toBeNull();

    // Check state properties
    expect(typeof result.current.isScanning).toBe('boolean');
    expect(typeof result.current.scanProgress).toBe('number');
    expect(typeof result.current.selectedScanType).toBe('string');
    expect(Array.isArray(result.current.scanResults)).toBe(true);
    expect(typeof result.current.currentScanStep).toBe('string');
    expect(Array.isArray(result.current.scannedFiles)).toBe(true);
    expect(typeof result.current.totalFilesToScan).toBe('number');
    expect(typeof result.current.currentFileIndex).toBe('number');
    expect(typeof result.current.virusTotalRequestsUsed).toBe('number');

    // Check action properties
    expect(typeof result.current.setSelectedScanType).toBe('function');
    expect(typeof result.current.startScan).toBe('function');
    expect(typeof result.current.stopScan).toBe('function');
    expect(typeof result.current.scanSingleFile).toBe('function');
    expect(typeof result.current.scanUploadedFile).toBe('function');
    expect(typeof result.current.fetchFilesList).toBe('function');
    expect(typeof result.current.resetScan).toBe('function');
  });

  it('should handle scan type changes correctly', () => {
    const { result } = renderHook(() => useSecurityScanning());

    // Verify hook rendered properly
    expect(result.current).not.toBeNull();
    expect(result.current.setSelectedScanType).toBeDefined();

    const scanTypes = ['quick', 'full', 'custom'] as const;

    scanTypes.forEach((scanType) => {
      act(() => {
        result.current.setSelectedScanType(scanType);
      });

      expect(result.current.selectedScanType).toBe(scanType);
    });
  });
});
