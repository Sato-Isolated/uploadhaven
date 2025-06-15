import { describe, it, expect } from 'vitest';
import {
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
  EXPIRATION_VALUES,
  getExpirationOptions,
} from '../types';

describe('FileUploader Types and Constants', () => {
  describe('Constants', () => {
    it('should have correct max file size (100MB)', () => {
      expect(MAX_FILE_SIZE).toBe(100 * 1024 * 1024);
      expect(MAX_FILE_SIZE).toBe(104857600); // 100MB in bytes
    });

    it('should include expected file types', () => {
      expect(ALLOWED_TYPES).toContain('image/jpeg');
      expect(ALLOWED_TYPES).toContain('image/png');
      expect(ALLOWED_TYPES).toContain('image/gif');
      expect(ALLOWED_TYPES).toContain('image/webp');
      expect(ALLOWED_TYPES).toContain('text/plain');
      expect(ALLOWED_TYPES).toContain('application/pdf');
      expect(ALLOWED_TYPES).toContain('application/zip');
      expect(ALLOWED_TYPES).toContain('video/mp4');
      expect(ALLOWED_TYPES).toContain('audio/mpeg');
    });

    it('should have all expected expiration values', () => {
      expect(EXPIRATION_VALUES).toEqual(['1h', '24h', '7d', '30d', 'never']);
      expect(EXPIRATION_VALUES).toHaveLength(5);
    });

    it('should be readonly array for expiration values', () => {
      // Test that EXPIRATION_VALUES is a readonly array (TypeScript enforced)
      expect(Array.isArray(EXPIRATION_VALUES)).toBe(true);
    });
  });

  describe('getExpirationOptions', () => {
    it('should transform expiration values with translation function', () => {
      const mockTranslate = (key: string) => `translated-${key}`;
      
      const options = getExpirationOptions(mockTranslate);

      expect(options).toEqual([
        { value: '1h', label: 'translated-1h' },
        { value: '24h', label: 'translated-24h' },
        { value: '7d', label: 'translated-7d' },
        { value: '30d', label: 'translated-30d' },
        { value: 'never', label: 'translated-never' },
      ]);
    });

    it('should handle different translation functions', () => {
      const frenchTranslate = (key: string) => {
        const translations: Record<string, string> = {
          '1h': '1 heure',
          '24h': '24 heures',
          '7d': '7 jours',
          '30d': '30 jours',
          'never': 'jamais',
        };
        return translations[key] || key;
      };

      const options = getExpirationOptions(frenchTranslate);

      expect(options).toEqual([
        { value: '1h', label: '1 heure' },
        { value: '24h', label: '24 heures' },
        { value: '7d', label: '7 jours' },
        { value: '30d', label: '30 jours' },
        { value: 'never', label: 'jamais' },
      ]);
    });

    it('should return correct structure for each option', () => {
      const mockTranslate = (key: string) => `label-${key}`;
      const options = getExpirationOptions(mockTranslate);

      options.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });

    it('should preserve original expiration values', () => {
      const mockTranslate = (key: string) => `translated-${key}`;
      const options = getExpirationOptions(mockTranslate);

      const values = options.map(option => option.value);
      expect(values).toEqual(['1h', '24h', '7d', '30d', 'never']);
    });

    it('should handle empty or undefined translation', () => {
      const emptyTranslate = () => '';
      const options = getExpirationOptions(emptyTranslate);

      expect(options).toHaveLength(5);
      options.forEach((option) => {
        expect(option.label).toBe('');
        expect(EXPIRATION_VALUES).toContain(option.value as any);
      });
    });
  });

  describe('File Type Coverage', () => {
    it('should cover common image formats', () => {
      const imageTypes = ALLOWED_TYPES.filter(type => type.startsWith('image/'));
      expect(imageTypes).toContain('image/jpeg');
      expect(imageTypes).toContain('image/png');
      expect(imageTypes).toContain('image/gif');
      expect(imageTypes).toContain('image/webp');
    });

    it('should cover document formats', () => {
      const documentTypes = ALLOWED_TYPES.filter(type => 
        type === 'text/plain' || type === 'application/pdf'
      );
      expect(documentTypes).toContain('text/plain');
      expect(documentTypes).toContain('application/pdf');
    });

    it('should cover media formats', () => {
      expect(ALLOWED_TYPES).toContain('video/mp4');
      expect(ALLOWED_TYPES).toContain('audio/mpeg');
    });

    it('should cover archive formats', () => {
      expect(ALLOWED_TYPES).toContain('application/zip');
    });
  });

  describe('Security Considerations', () => {
    it('should not include potentially dangerous file types', () => {
      const dangerousTypes = [
        'application/x-executable',
        'application/x-msdownload',
        'text/javascript',
        'application/javascript',
      ];

      dangerousTypes.forEach(type => {
        expect(ALLOWED_TYPES).not.toContain(type);
      });
    });

    it('should have reasonable file size limit', () => {
      // 100MB should be reasonable for most use cases but not too large
      expect(MAX_FILE_SIZE).toBeGreaterThan(10 * 1024 * 1024); // At least 10MB
      expect(MAX_FILE_SIZE).toBeLessThanOrEqual(200 * 1024 * 1024); // No more than 200MB
    });
  });
});
