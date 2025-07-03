import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FileUploadValidator, 
  FileNameValidator, 
  FilePasswordValidator 
} from '../file-validators';
import { FileConfiguration } from '../../shared/configuration';
import { FileUploadRequest } from '../file-value-objects';

describe('FileUploadValidator', () => {
  let validator: FileUploadValidator;
  let config: FileConfiguration;

  beforeEach(() => {
    config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'text/plain', 'application/pdf'],
      defaultExpirationHours: 24,
      maxExpirationHours: 168,
      minExpirationHours: 1,
      maxMaxDownloads: 100
    };
    validator = new FileUploadValidator(config);
  });

  describe('Valid file uploads', () => {
    it('should validate a correct file upload request', () => {
      const file = createMockFile('test.txt', 'Hello world', 'text/plain');
      const request: FileUploadRequest = {
        file,
        expirationHours: 24,
        maxDownloads: 5
      };

      const result = validator.validate(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow files without optional parameters', () => {
      const file = createMockFile('test.jpg', 'image data', 'image/jpeg');
      const request: FileUploadRequest = { file };

      const result = validator.validate(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('File validation', () => {
    it('should reject missing file', () => {
      const request = { file: null } as any;

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'file',
            code: 'FILE_REQUIRED'
          })
        ])
      );
    });

    it('should reject file with invalid name', () => {
      const file = createMockFile('invalid<>file.txt', 'content', 'text/plain');
      const request: FileUploadRequest = { file };

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'file.name',
            code: 'INVALID_FILE_NAME'
          })
        ])
      );
    });

    it('should reject file that is too large', () => {
      // Create a large file (15MB)
      const largeContent = 'x'.repeat(15 * 1024 * 1024);
      const file = createMockFile('large.txt', largeContent, 'text/plain');
      const request: FileUploadRequest = { file };

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'file.size',
            code: 'INVALID_FILE_SIZE'
          })
        ])
      );
    });

    it('should reject file with invalid MIME type', () => {
      const file = createMockFile('script.js', 'console.log("hello")', 'application/javascript');
      const request: FileUploadRequest = { file };

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'file.type',
            code: 'INVALID_MIME_TYPE'
          })
        ])
      );
    });
  });

  describe('Expiration hours validation', () => {
    it('should reject expiration hours below minimum', () => {
      const file = createMockFile('test.txt', 'content', 'text/plain');
      const request: FileUploadRequest = {
        file,
        expirationHours: 0
      };

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'expirationHours',
            code: 'INVALID_EXPIRATION_HOURS'
          })
        ])
      );
    });

    it('should reject expiration hours above maximum', () => {
      const file = createMockFile('test.txt', 'content', 'text/plain');
      const request: FileUploadRequest = {
        file,
        expirationHours: 200 // Above max of 168
      };

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'expirationHours',
            code: 'INVALID_EXPIRATION_HOURS'
          })
        ])
      );
    });
  });

  describe('Max downloads validation', () => {
    it('should reject max downloads below 1', () => {
      const file = createMockFile('test.txt', 'content', 'text/plain');
      const request: FileUploadRequest = {
        file,
        maxDownloads: 0
      };

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'maxDownloads',
            code: 'INVALID_MAX_DOWNLOADS'
          })
        ])
      );
    });

    it('should reject max downloads above limit', () => {
      const file = createMockFile('test.txt', 'content', 'text/plain');
      const request: FileUploadRequest = {
        file,
        maxDownloads: 150 // Above max of 100
      };

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'maxDownloads',
            code: 'INVALID_MAX_DOWNLOADS'
          })
        ])
      );
    });
  });
});

describe('FileNameValidator', () => {
  let validator: FileNameValidator;

  beforeEach(() => {
    validator = new FileNameValidator();
  });

  describe('Valid file names', () => {
    it('should validate normal file names', () => {
      const validNames = [
        'document.pdf',
        'image.jpg',
        'My File.txt',
        'file_with_underscores.doc',
        'file-with-dashes.xlsx'
      ];

      validNames.forEach(name => {
        const result = validator.validate(name);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Invalid file names', () => {
    it('should reject empty or whitespace-only names', () => {
      const invalidNames = ['', '   ', '\t\n'];

      invalidNames.forEach(name => {
        const result = validator.validate(name);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('EMPTY_FILE_NAME');
      });
    });

    it('should reject names that are too long', () => {
      const longName = 'x'.repeat(300);
      const result = validator.validate(longName);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'FILE_NAME_TOO_LONG'
          })
        ])
      );
    });

    it('should reject names with forbidden characters', () => {
      const forbiddenNames = [
        'file<name.txt',
        'file>name.txt',
        'file:name.txt',
        'file"name.txt',
        'file/name.txt',
        'file\\name.txt',
        'file|name.txt',
        'file?name.txt',
        'file*name.txt'
      ];

      forbiddenNames.forEach(name => {
        const result = validator.validate(name);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('FORBIDDEN_CHARACTERS');
      });
    });

    it('should reject reserved Windows names', () => {
      const reservedNames = [
        'CON.txt',
        'PRN.doc',
        'AUX.pdf',
        'NUL.jpg',
        'COM1.txt',
        'LPT9.doc'
      ];

      reservedNames.forEach(name => {
        const result = validator.validate(name);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('RESERVED_FILE_NAME');
      });
    });

    it('should reject dangerous file extensions', () => {
      const dangerousNames = [
        'virus.exe',
        'script.bat',
        'malware.cmd',
        'trojan.scr',
        'bad.vbs'
      ];

      dangerousNames.forEach(name => {
        const result = validator.validate(name);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('DANGEROUS_EXTENSION');
      });
    });
  });
});

describe('FilePasswordValidator', () => {
  let validator: FilePasswordValidator;

  beforeEach(() => {
    validator = new FilePasswordValidator();
  });

  describe('Valid passwords', () => {
    it('should validate undefined password', () => {
      const result = validator.validate(undefined);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid passwords', () => {
      const validPasswords = [
        'simple',
        'password123',
        'My$ecur3P@ssw0rd',
        'a'.repeat(64) // 64 characters
      ];

      validPasswords.forEach(password => {
        const result = validator.validate(password);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Invalid passwords', () => {
    it('should reject passwords that are too short', () => {
      const shortPasswords = ['', 'a', 'ab', 'abc'];

      shortPasswords.forEach(password => {
        const result = validator.validate(password);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('PASSWORD_TOO_SHORT');
      });
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'x'.repeat(150);
      const result = validator.validate(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'PASSWORD_TOO_LONG'
          })
        ])
      );
    });
  });
});
