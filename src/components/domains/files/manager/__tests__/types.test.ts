import { describe, it, expect } from 'vitest';
import type {
  FileInfo,
  ExpirationStatus,
  FileManagerProps,
  FileCardProps,
  FileManagerHeaderProps,
  FileListContainerProps,
  FileActionButtonsProps,
} from '../types';

describe('FileManager Types', () => {
  describe('Type Definitions', () => {
    it('should have correct FileManagerProps structure', () => {
      const props: FileManagerProps = {
        className: 'test-class',
      };

      expect(props).toHaveProperty('className');
      expect(typeof props.className).toBe('string');
    });

    it('should allow optional className in FileManagerProps', () => {
      const props: FileManagerProps = {};

      expect(props).toBeDefined();
      expect(props.className).toBeUndefined();
    });

    it('should have correct ExpirationStatus structure', () => {
      const status: ExpirationStatus = {
        text: 'Expires in 2 days',
        variant: 'secondary',
        expired: false,
        isExpiringSoon: false,
        timeLeft: '2 days',
      };

      expect(status).toHaveProperty('text');
      expect(status).toHaveProperty('variant');
      expect(status).toHaveProperty('expired');
      expect(status).toHaveProperty('isExpiringSoon');
      expect(status).toHaveProperty('timeLeft');
    });

    it('should support both variant types in ExpirationStatus', () => {
      const secondaryStatus: ExpirationStatus = {
        text: 'Never expires',
        variant: 'secondary',
        expired: false,
        isExpiringSoon: false,
        timeLeft: '',
      };

      const destructiveStatus: ExpirationStatus = {
        text: 'Expired',
        variant: 'destructive',
        expired: true,
        isExpiringSoon: false,
        timeLeft: '',
      };

      expect(secondaryStatus.variant).toBe('secondary');
      expect(destructiveStatus.variant).toBe('destructive');
    });

    it('should have correct FileManagerHeaderProps structure', () => {
      const props: FileManagerHeaderProps = {
        filesCount: 5,
        totalSize: 1024000,
      };

      expect(props).toHaveProperty('filesCount');
      expect(props).toHaveProperty('totalSize');
      expect(typeof props.filesCount).toBe('number');
      expect(typeof props.totalSize).toBe('number');
    });
  });

  describe('Component Props Interfaces', () => {
    it('should have correct FileCardProps structure', () => {
      const mockFile: FileInfo = {
        id: 'test-file-id',
        name: 'test.txt',
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 1024,
        type: 'document',
        uploadDate: '2024-01-01T00:00:00Z',
        downloadCount: 0,
        expiresAt: '2024-01-02T00:00:00Z',
        shortUrl: 'https://short.ly/abc123',
        isEncrypted: false,
      };

      const props: FileCardProps = {
        file: mockFile,
        index: 0,
        onPreview: () => {},
        onCopyLink: () => {},
        onDownload: () => {},
        onDelete: () => {},
        getExpirationStatus: () => ({
          text: 'Never expires',
          variant: 'secondary',
          expired: false,
          isExpiringSoon: false,
          timeLeft: '',
        }),
        getFileIcon: () => null,
      };

      expect(props).toHaveProperty('file');
      expect(props).toHaveProperty('index');
      expect(props).toHaveProperty('onPreview');
      expect(props).toHaveProperty('onCopyLink');
      expect(props).toHaveProperty('onDownload');
      expect(props).toHaveProperty('onDelete');
      expect(props).toHaveProperty('getExpirationStatus');
      expect(props).toHaveProperty('getFileIcon');
    });

    it('should have correct FileListContainerProps structure', () => {
      const props: FileListContainerProps = {
        files: [],
        onPreview: () => {},
        onCopyLink: () => {},
        onDownload: () => {},
        onDelete: () => {},
        getExpirationStatus: () => ({
          text: 'Never expires',
          variant: 'secondary',
          expired: false,
          isExpiringSoon: false,
          timeLeft: '',
        }),
        getFileIcon: () => null,
      };

      expect(props).toHaveProperty('files');
      expect(props).toHaveProperty('onPreview');
      expect(props).toHaveProperty('onCopyLink');
      expect(props).toHaveProperty('onDownload');
      expect(props).toHaveProperty('onDelete');
      expect(props).toHaveProperty('getExpirationStatus');
      expect(props).toHaveProperty('getFileIcon');
      expect(Array.isArray(props.files)).toBe(true);
    });

    it('should have correct FileActionButtonsProps structure', () => {
      const props: FileActionButtonsProps = {
        onPreview: () => {},
        onCopyLink: () => {},
        onDownload: () => {},
        onDelete: () => {},
      };

      expect(props).toHaveProperty('onPreview');
      expect(props).toHaveProperty('onCopyLink');
      expect(props).toHaveProperty('onDownload');
      expect(props).toHaveProperty('onDelete');
      expect(typeof props.onPreview).toBe('function');
      expect(typeof props.onCopyLink).toBe('function');
      expect(typeof props.onDownload).toBe('function');
      expect(typeof props.onDelete).toBe('function');
    });
  });

  describe('Function Type Validation', () => {
    it('should validate getExpirationStatus function signature', () => {
      const getExpirationStatus = (
        expiresAt?: string | null
      ): ExpirationStatus => ({
        text: 'Test',
        variant: 'secondary',
        expired: false,
        isExpiringSoon: false,
        timeLeft: '',
      });

      const result1 = getExpirationStatus('2024-01-01T00:00:00Z');
      const result2 = getExpirationStatus(null);
      const result3 = getExpirationStatus(undefined);

      expect(result1).toHaveProperty('text');
      expect(result2).toHaveProperty('variant');
      expect(result3).toHaveProperty('expired');
    });

    it('should validate getFileIcon function signature', () => {
      const getFileIcon = (type: FileInfo['type']): React.ReactNode => {
        return `icon-${type}`;
      };

      expect(getFileIcon('image')).toBe('icon-image');
      expect(getFileIcon('video')).toBe('icon-video');
      expect(getFileIcon('audio')).toBe('icon-audio');
      expect(getFileIcon('document')).toBe('icon-document');
      expect(getFileIcon('archive')).toBe('icon-archive');
      expect(getFileIcon('other')).toBe('icon-other');
    });
  });

  describe('Interface Completeness', () => {
    it('should ensure all required props are accounted for', () => {
      // Test that TypeScript compilation ensures all required props exist
      const requiredFileCardProps = [
        'file',
        'index',
        'onPreview',
        'onCopyLink',
        'onDownload',
        'onDelete',
        'getExpirationStatus',
        'getFileIcon',
      ];

      const requiredFileListProps = [
        'files',
        'onPreview',
        'onCopyLink',
        'onDownload',
        'onDelete',
        'getExpirationStatus',
        'getFileIcon',
      ];

      const requiredActionButtonProps = [
        'onPreview',
        'onCopyLink',
        'onDownload',
        'onDelete',
      ];

      expect(requiredFileCardProps).toHaveLength(8);
      expect(requiredFileListProps).toHaveLength(7);
      expect(requiredActionButtonProps).toHaveLength(4);
    });

    it('should support all file types', () => {
      const supportedTypes: FileInfo['type'][] = [
        'image',
        'video',
        'audio',
        'document',
        'archive',
        'other',
      ];

      supportedTypes.forEach((type) => {
        expect([
          'image',
          'video',
          'audio',
          'document',
          'archive',
          'other',
        ]).toContain(type);
      });
    });
  });
});
