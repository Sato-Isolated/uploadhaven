import {
  cn,
  buildShortUrl,
  hashPassword,
  verifyPassword,
  validatePassword,
  formatFileSize,
  getClientIP,
  validateFileAdvanced,
} from '../core/utils';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock bcrypt for testing
vi.mock('bcryptjs');
const mockedBcrypt = bcrypt as any;

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', { bar: true })).toBe('foo bar');
      expect(cn('foo', { bar: false })).toBe('foo');
    });

    it('should handle Tailwind conflicts', () => {
      expect(cn('px-2 px-4')).toBe('px-4');
      expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('buildShortUrl', () => {
    const originalEnv = process.env.NEXT_PUBLIC_BASE_URL;

    afterEach(() => {
      process.env.NEXT_PUBLIC_BASE_URL = originalEnv;
    });

    it('should build URL with provided base URL', () => {
      const result = buildShortUrl('abc123', 'https://example.com');
      expect(result).toBe('https://example.com/s/abc123');
    });

    it('should use environment variable when no base URL provided', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://production.com';
      const result = buildShortUrl('abc123');
      expect(result).toBe('https://production.com/s/abc123');
    });

    it('should fallback to localhost when no base URL or env var', () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;
      const result = buildShortUrl('abc123');
      expect(result).toBe('http://localhost:3000/s/abc123');
    });
  });

  describe('Password Functions', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('hashPassword', () => {
      it('should hash password with bcrypt', async () => {
        const mockHash = 'hashedPassword123';
        (mockedBcrypt.hash as any).mockResolvedValue(mockHash);

        const result = await hashPassword('password123');

        expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 12);
        expect(result).toBe(mockHash);
      });
    });

    describe('verifyPassword', () => {
      it('should verify password correctly', async () => {
        (mockedBcrypt.compare as any).mockResolvedValue(true);

        const result = await verifyPassword('password123', 'hashedPassword');

        expect(mockedBcrypt.compare).toHaveBeenCalledWith(
          'password123',
          'hashedPassword'
        );
        expect(result).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        (mockedBcrypt.compare as any).mockResolvedValue(false);

        const result = await verifyPassword('wrongPassword', 'hashedPassword');

        expect(result).toBe(false);
      });
    });

    describe('validatePassword', () => {
      it('should accept valid passwords', () => {
        const result = validatePassword('validPassword123');
        expect(result).toEqual({ valid: true });
      });

      it('should reject passwords that are too short', () => {
        const result = validatePassword('12345');
        expect(result).toEqual({
          valid: false,
          error: 'Password must be at least 6 characters long',
        });
      });

      it('should reject passwords that are too long', () => {
        const longPassword = 'a'.repeat(129);
        const result = validatePassword(longPassword);
        expect(result).toEqual({
          valid: false,
          error: 'Password must be less than 128 characters long',
        });
      });
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places correctly', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(5242880)).toBe('5 MB');
    });
  });

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const result = getClientIP(mockRequest);
      expect(result).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is not available', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'x-real-ip') return '192.168.1.2';
            return null;
          }),
        },
      } as unknown as NextRequest;

      const result = getClientIP(mockRequest);
      expect(result).toBe('192.168.1.2');
    });

    it('should fallback to localhost when no IP headers are present', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const result = getClientIP(mockRequest);
      expect(result).toBe('127.0.0.1');
    });
  });

  describe('validateFileAdvanced', () => {
    const createMockFile = (name: string, size: number, type: string): File => {
      return {
        name,
        size,
        type,
        lastModified: Date.now(),
        arrayBuffer: vi.fn(),
        slice: vi.fn(),
        stream: vi.fn(),
        text: vi.fn(),
      } as unknown as File;
    };

    it('should validate normal files successfully', () => {
      const file = createMockFile(
        'document.pdf',
        1024 * 1024,
        'application/pdf'
      );
      const result = validateFileAdvanced(file);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject files that exceed size limit', () => {
      const file = createMockFile(
        'largefile.pdf',
        101 * 1024 * 1024,
        'application/pdf'
      );
      const result = validateFileAdvanced(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File size exceeds 100 MB limit');
    });

    it('should reject suspicious file types', () => {
      const file = createMockFile(
        'suspicious.exe',
        1024,
        'application/x-msdownload'
      );
      const result = validateFileAdvanced(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'File type not allowed for security reasons'
      );
    });

    it('should reject files with suspicious extensions', () => {
      const file = createMockFile(
        'script.exe',
        1024,
        'application/octet-stream'
      );
      const result = validateFileAdvanced(file);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File extension not allowed');
    });

    it('should warn about large files', () => {
      const file = createMockFile(
        'largefile.pdf',
        15 * 1024 * 1024,
        'application/pdf'
      );
      const result = validateFileAdvanced(file);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Large file size may impact upload performance'
      );
    });
  });
});
