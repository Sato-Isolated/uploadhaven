/**
 * EncryptionService Tests
 * 
 * Basic tests for the infrastructure encryption service.
 * More comprehensive tests are in the entity test files.
 */
import { describe, it, expect } from 'vitest';
import { EncryptionService } from '../infrastructure/crypto/encryption.service';

describe('EncryptionService', () => {
  it('should exist and be importable', () => {
    expect(EncryptionService).toBeDefined();
  });

  it('should be instantiable', () => {
    const service = new EncryptionService();
    expect(service).toBeInstanceOf(EncryptionService);
  });
});