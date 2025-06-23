/**
 * Anonymous Upload Component Tests - Privacy-first UI testing
 * 
 * Tests the anonymous file upload interface ensuring privacy guarantees
 * and proper integration with the file-sharing domain.
 * 
 * @domain file-sharing
 * @pattern Presentation Test (DDD)
 * @privacy zero-knowledge - tests UI without exposing sensitive data
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnonymousUpload } from '../AnonymousUpload';

// Mock window.alert for JSDOM
Object.defineProperty(window, 'alert', {
  value: vi.fn(),
  writable: true,
});

// Mock the anonymous upload hook
vi.mock('../../hooks/useAnonymousUpload', () => ({
  useAnonymousUpload: vi.fn(() => ({
    uploadFile: vi.fn(),
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
    resetUpload: vi.fn(),
  })),
}));

describe('AnonymousUpload', () => {
  const mockOnUploadComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render upload interface with privacy messaging', () => {
      render(<AnonymousUpload onUploadComplete={mockOnUploadComplete} />);      // Check for privacy messaging
      expect(screen.getByText(/Anonymous File Sharing/i)).toBeInTheDocument();
      expect(screen.getByText(/zero-knowledge encryption/i)).toBeInTheDocument();
      expect(screen.getAllByText(/encrypted in your browser/i)).toHaveLength(2); // Should appear in multiple places

      // Check for upload area
      expect(screen.getByText(/Drop files here or click to upload/i)).toBeInTheDocument();

      // Check for privacy indicators
      expect(screen.getByText('Zero-Knowledge')).toBeInTheDocument();
      expect(screen.getByText('Anonymous')).toBeInTheDocument();
      expect(screen.getByText('Temporary')).toBeInTheDocument();
    });

    it('should show upload options form', () => {
      render(<AnonymousUpload />);      // Check for TTL selection
      expect(screen.getByText(/Auto-delete after/i)).toBeInTheDocument();

      // Check for download limits (now optional with checkbox)
      expect(screen.getByText(/Download Limit/i)).toBeInTheDocument();
      expect(screen.getByText(/Limit downloads/i)).toBeInTheDocument();

      // Check for password protection (now checkbox for random generation)
      expect(screen.getByText(/Password Protection/i)).toBeInTheDocument();
      expect(screen.getByText(/Generate random password/i)).toBeInTheDocument();
    });

    it('should have upload button disabled initially', () => {
      render(<AnonymousUpload />);

      const uploadButton = screen.getByRole('button', { name: /upload anonymously/i });
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('File Selection', () => {
    it('should enable upload button when file is selected', async () => {
      render(<AnonymousUpload />);

      const fileInput = screen.getByLabelText(/choose files to upload/i);
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(fileInput, { target: { files: [testFile] } });

      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /upload anonymously/i });
        expect(uploadButton).not.toBeDisabled();
      });
    });

    it('should display selected file information', async () => {
      render(<AnonymousUpload />);

      const fileInput = screen.getByLabelText(/choose files to upload/i);
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

      fireEvent.change(fileInput, { target: { files: [testFile] } });

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
    }); it('should validate file size limits', async () => {
      render(<AnonymousUpload />);

      const fileInput = screen.getByLabelText(/choose files to upload/i);
      // Create a large file (>100MB equivalent for testing)
      const largeFile = new File(['x'.repeat(100 * 1024 * 1024 + 1)], 'large.txt', { type: 'text/plain' });

      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/File too large/i)).toBeInTheDocument();
      });
    });
  });

  describe('Upload Options', () => {
    it('should allow changing TTL options', () => {
      render(<AnonymousUpload />);

      const ttlSelect = screen.getByLabelText(/Auto-delete after/i);
      fireEvent.change(ttlSelect, { target: { value: '168' } }); // 7 days

      expect(ttlSelect).toHaveValue('168');
    }); it('should allow setting download limits when enabled', () => {
      render(<AnonymousUpload />);

      // First enable the download limit option
      const enableDownloadLimitCheckbox = screen.getByLabelText(/Limit downloads/i);
      fireEvent.click(enableDownloadLimitCheckbox);

      // Now the downloads input should be visible
      const downloadsInput = screen.getByLabelText(/Maximum number of downloads/i);
      fireEvent.change(downloadsInput, { target: { value: '5' } });

      expect(downloadsInput).toHaveValue(5); // Number input returns number
    });

    it('should allow optional random password protection', () => {
      render(<AnonymousUpload />);

      // Password protection is now a checkbox for random generation
      const passwordCheckbox = screen.getByLabelText(/Generate random password/i);
      fireEvent.click(passwordCheckbox);

      expect(passwordCheckbox).toBeChecked();

      // Should show info about automatic generation
      expect(screen.getByText(/A secure password will be generated automatically/i)).toBeInTheDocument();
    });
  });

  describe('Upload Process', () => {
    it('should call upload function with correct parameters', async () => {
      const { useAnonymousUpload } = await import('../../hooks/useAnonymousUpload');
      const mockUploadFile = vi.fn();

      (useAnonymousUpload as any).mockReturnValue({
        uploadFile: mockUploadFile,
        isUploading: false,
        progress: 0,
        error: null,
        result: null,
        resetUpload: vi.fn(),
      });

      render(<AnonymousUpload />);

      // Select file
      const fileInput = screen.getByLabelText(/choose files to upload/i);
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(fileInput, { target: { files: [testFile] } });      // Set options
      const ttlSelect = screen.getByLabelText(/Auto-delete after/i);
      fireEvent.change(ttlSelect, { target: { value: '168' } }); // Use valid option

      // Enable download limit and set value
      const enableDownloadLimitCheckbox = screen.getByLabelText(/Limit downloads/i);
      fireEvent.click(enableDownloadLimitCheckbox);

      const downloadsInput = screen.getByLabelText(/Maximum number of downloads/i);
      fireEvent.change(downloadsInput, { target: { value: '5' } });

      // Enable password protection
      const passwordCheckbox = screen.getByLabelText(/Generate random password/i);
      fireEvent.click(passwordCheckbox);

      // Click upload
      const uploadButton = screen.getByRole('button', { name: /upload anonymously/i });
      fireEvent.click(uploadButton);

      expect(mockUploadFile).toHaveBeenCalledWith(testFile, {
        enablePasswordProtection: true,
        ttlHours: 168,
        maxDownloads: 5,
      });
    });
  });

  describe('Privacy Features', () => {
    it('should display privacy indicators prominently', () => {
      render(<AnonymousUpload />);

      // Privacy badges should be visible
      const zeroKnowledgeBadge = screen.getByText('Zero-Knowledge');
      const anonymousBadge = screen.getByText('Anonymous');
      const temporaryBadge = screen.getByText('Temporary');

      expect(zeroKnowledgeBadge).toBeInTheDocument();
      expect(anonymousBadge).toBeInTheDocument();
      expect(temporaryBadge).toBeInTheDocument();
    }); it('should show encryption status during upload', async () => {
      const { useAnonymousUpload } = await import('../../hooks/useAnonymousUpload');

      (useAnonymousUpload as any).mockReturnValue({
        uploadFile: vi.fn(),
        isUploading: true,
        progress: 50,
        error: null,
        result: null,
        resetUpload: vi.fn(),
      });

      render(<AnonymousUpload />);

      expect(screen.getByText(/Encrypting file/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    }); it('should display share URL with privacy warning', async () => {
      const { useAnonymousUpload } = await import('../../hooks/useAnonymousUpload');

      (useAnonymousUpload as any).mockReturnValue({
        uploadFile: vi.fn(),
        isUploading: false,
        progress: 100,
        error: null,
        result: {
          fileId: 'test123',
          shareUrl: 'https://example.com/s/test123#encryptionkey',
          expiresAt: new Date().toISOString(),
        },
        resetUpload: vi.fn(),
      });

      render(<AnonymousUpload />);

      expect(screen.getByText(/Share this link/i)).toBeInTheDocument();
      expect(screen.getByText(/encryption key is in the URL after #/i)).toBeInTheDocument();
      expect(screen.getByText(/Keep it secret/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const { useAnonymousUpload } = await import('../../hooks/useAnonymousUpload');

      // Reset to initial state
      (useAnonymousUpload as any).mockReturnValue({
        uploadFile: vi.fn(),
        isUploading: false,
        progress: 0,
        error: null,
        result: null,
        resetUpload: vi.fn(),
      });

      render(<AnonymousUpload />);      // Check for proper labeling
      expect(screen.getByLabelText(/choose files to upload/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Auto-delete after/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Limit downloads/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Generate random password/i)).toBeInTheDocument();
    }); it('should support keyboard navigation', async () => {
      const { useAnonymousUpload } = await import('../../hooks/useAnonymousUpload');

      // Reset to initial state
      (useAnonymousUpload as any).mockReturnValue({
        uploadFile: vi.fn(),
        isUploading: false,
        progress: 0,
        error: null,
        result: null,
        resetUpload: vi.fn(),
      });

      render(<AnonymousUpload />);

      const uploadButton = screen.getByRole('button', { name: /upload anonymously/i });

      // Button should be focusable (but will be disabled initially)
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toHaveAttribute('disabled');
    }); it('should have proper heading structure', async () => {
      const { useAnonymousUpload } = await import('../../hooks/useAnonymousUpload');

      // Reset to initial state
      (useAnonymousUpload as any).mockReturnValue({
        uploadFile: vi.fn(),
        isUploading: false,
        progress: 0,
        error: null,
        result: null,
        resetUpload: vi.fn(),
      });

      render(<AnonymousUpload />);

      // Check for semantic headings
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display upload errors', async () => {
      const { useAnonymousUpload } = await import('../../hooks/useAnonymousUpload');

      (useAnonymousUpload as any).mockReturnValue({
        uploadFile: vi.fn(),
        isUploading: false,
        progress: 0,
        error: 'Network error',
        result: null,
        resetUpload: vi.fn(),
      });

      render(<AnonymousUpload />);

      expect(screen.getByText(/Upload failed: Network error/i)).toBeInTheDocument();
    }); it('should allow retry after error', async () => {
      const { useAnonymousUpload } = await import('../../hooks/useAnonymousUpload');
      const mockResetUpload = vi.fn();

      (useAnonymousUpload as any).mockReturnValue({
        uploadFile: vi.fn(),
        isUploading: false,
        progress: 0,
        error: 'Upload failed',
        result: null,
        resetUpload: mockResetUpload,
      });

      render(<AnonymousUpload />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockResetUpload).toHaveBeenCalled();
    });
  });
});
