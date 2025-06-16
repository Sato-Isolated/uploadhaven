import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFileType, copyToClipboard, saveFileToLocalStorage } from '../utils';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
});

describe('FileUploader Utils', () => {
  describe('getFileType', () => {
    it('should identify image files correctly', () => {
      expect(getFileType('photo.jpg')).toBe('image');
      expect(getFileType('picture.jpeg')).toBe('image');
      expect(getFileType('graphic.png')).toBe('image');
      expect(getFileType('animation.gif')).toBe('image');
      expect(getFileType('modern.webp')).toBe('image');
      expect(getFileType('vector.svg')).toBe('image');
    });

    it('should identify video files correctly', () => {
      expect(getFileType('movie.mp4')).toBe('video');
      expect(getFileType('clip.webm')).toBe('video');
      expect(getFileType('old.avi')).toBe('video');
      expect(getFileType('quicktime.mov')).toBe('video');
    });

    it('should identify audio files correctly', () => {
      expect(getFileType('song.mp3')).toBe('audio');
      expect(getFileType('sound.wav')).toBe('audio');
      expect(getFileType('music.ogg')).toBe('audio');
      expect(getFileType('lossless.flac')).toBe('audio');
    });

    it('should identify document files correctly', () => {
      expect(getFileType('document.pdf')).toBe('document');
      expect(getFileType('readme.txt')).toBe('document');
      expect(getFileType('notes.md')).toBe('document');
      expect(getFileType('letter.doc')).toBe('document');
      expect(getFileType('report.docx')).toBe('document');
    });

    it('should identify archive files correctly', () => {
      expect(getFileType('archive.zip')).toBe('archive');
      expect(getFileType('compressed.rar')).toBe('archive');
      expect(getFileType('files.7z')).toBe('archive');
      expect(getFileType('backup.tar')).toBe('archive');
      expect(getFileType('compressed.gz')).toBe('archive');
    });

    it('should return "other" for unknown extensions', () => {
      expect(getFileType('unknown.xyz')).toBe('other');
      expect(getFileType('no-extension')).toBe('other');
      expect(getFileType('')).toBe('other');
    });

    it('should handle case insensitive extensions', () => {
      expect(getFileType('IMAGE.JPG')).toBe('image');
      expect(getFileType('Video.MP4')).toBe('video');
      expect(getFileType('Audio.MP3')).toBe('audio');
    });

    it('should handle multiple dots in filename', () => {
      expect(getFileType('my.file.name.pdf')).toBe('document');
      expect(getFileType('version.1.2.zip')).toBe('archive');
    });
  });
  describe('copyToClipboard', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should successfully copy URL to clipboard', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const result = await copyToClipboard('https://example.com');

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        'https://example.com'
      );
      expect(result).toEqual({
        success: true,
        message: 'URL copied to clipboard!',
      });
    });

    it('should use custom label when provided', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const result = await copyToClipboard('https://example.com', 'Share Link');

      expect(result).toEqual({
        success: true,
        message: 'Share Link copied to clipboard!',
      });
    });

    it('should handle clipboard write failures', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Permission denied'));

      const result = await copyToClipboard('https://example.com');

      expect(result).toEqual({
        success: false,
        message: 'Failed to copy URL',
      });
    });

    it('should handle clipboard write failures with custom label', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Permission denied'));

      const result = await copyToClipboard(
        'https://example.com',
        'Custom Label'
      );

      expect(result).toEqual({
        success: false,
        message: 'Failed to copy Custom Label',
      });
    });
  });
  describe('saveFileToLocalStorage', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should save file info to localStorage when no existing files', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const fileInfo = {
        name: 'test.txt',
        size: 1024,
        uploadDate: '2024-01-01T00:00:00Z',
        type: 'document',
        expiresAt: '2024-01-02T00:00:00Z',
      };

      saveFileToLocalStorage(fileInfo);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('uploadedFiles');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'uploadedFiles',
        JSON.stringify([fileInfo])
      );
    });

    it('should append to existing files in localStorage', () => {
      const existingFiles = [
        {
          name: 'existing.pdf',
          size: 2048,
          uploadDate: '2024-01-01T00:00:00Z',
          type: 'document',
          expiresAt: '2024-01-02T00:00:00Z',
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingFiles));

      const newFileInfo = {
        name: 'new.txt',
        size: 1024,
        uploadDate: '2024-01-01T12:00:00Z',
        type: 'document',
        expiresAt: '2024-01-02T12:00:00Z',
      };

      saveFileToLocalStorage(newFileInfo);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'uploadedFiles',
        JSON.stringify([...existingFiles, newFileInfo])
      );
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const fileInfo = {
        name: 'test.txt',
        size: 1024,
        uploadDate: '2024-01-01T00:00:00Z',
        type: 'document',
        expiresAt: '2024-01-02T00:00:00Z',
      };

      // Should not throw an error
      expect(() => saveFileToLocalStorage(fileInfo)).not.toThrow();
    });

    it('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const fileInfo = {
        name: 'test.txt',
        size: 1024,
        uploadDate: '2024-01-01T00:00:00Z',
        type: 'document',
        expiresAt: '2024-01-02T00:00:00Z',
      };

      // Should not throw an error and should handle gracefully
      expect(() => saveFileToLocalStorage(fileInfo)).not.toThrow();
    });

    it('should handle setItem localStorage errors', () => {
      mockLocalStorage.getItem.mockReturnValue('[]');
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      const fileInfo = {
        name: 'test.txt',
        size: 1024,
        uploadDate: '2024-01-01T00:00:00Z',
        type: 'document',
        expiresAt: '2024-01-02T00:00:00Z',
      };

      // Should not throw an error
      expect(() => saveFileToLocalStorage(fileInfo)).not.toThrow();
    });
  });
});
