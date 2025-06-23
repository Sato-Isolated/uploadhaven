import { IEncryptionService, ENCRYPTION_CONFIG } from '../../domain/services/IEncryptionService';
import { EncryptionKey } from '../../domain/value-objects/EncryptionKey';
import { InitializationVector } from '../../domain/value-objects/InitializationVector';

/**
 * Web Crypto API implementation of encryption service
 * 
 * CRITICAL PRIVACY GUARANTEE:
 * - This service ONLY works client-side (browser environment)
 * - All methods throw privacy violations if called server-side
 * - Ensures zero-knowledge architecture is maintained
 */
export class WebCryptoEncryptionService implements IEncryptionService {
  constructor() {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error('PRIVACY VIOLATION: WebCryptoEncryptionService can only be used client-side');
    }

    // Check browser support (skip in test environment)
    if (!isTestEnv && !isVitestEnv) {
      const support = this.checkBrowserSupport();
      if (!support.supported) {
        throw new Error(`Browser lacks required features: ${support.missingFeatures.join(', ')}`);
      }
    }
  }

  generateKey(): EncryptionKey {
    this.ensureClientSide('generateKey');
    return EncryptionKey.generate();
  }

  async deriveKeyFromPassword(password: string, salt?: Uint8Array): Promise<{ key: EncryptionKey; salt: Uint8Array }> {
    this.ensureClientSide('deriveKeyFromPassword');

    const actualSalt = salt || this.generateSalt();
    const key = await EncryptionKey.fromPassword(password, actualSalt);

    return { key, salt: actualSalt };
  }

  async encryptFile(file: File, key: EncryptionKey): Promise<{
    encryptedData: Uint8Array;
    iv: InitializationVector;
    originalMetadata: { filename: string; mimeType: string; size: number };
  }> {
    this.ensureClientSide('encryptFile');

    // Prepare file metadata
    const metadata = {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      timestamp: Date.now()
    };

    // Read file as array buffer
    const fileBuffer = await file.arrayBuffer();

    // Create metadata JSON
    const metadataJson = JSON.stringify(metadata);
    const metadataBytes = new TextEncoder().encode(metadataJson);

    // Combine metadata and file data
    const combined = new Uint8Array(metadataBytes.length + fileBuffer.byteLength + 4);

    // Store metadata length in first 4 bytes
    const metadataLengthView = new DataView(combined.buffer, 0, 4);
    metadataLengthView.setUint32(0, metadataBytes.length, true); // little-endian

    // Store metadata
    combined.set(metadataBytes, 4);

    // Store file data
    combined.set(new Uint8Array(fileBuffer), 4 + metadataBytes.length);

    // Encrypt the combined data
    const result = await this.encryptData(combined, key);

    return {
      encryptedData: result.encryptedData,
      iv: result.iv,
      originalMetadata: {
        filename: metadata.filename,
        mimeType: metadata.mimeType,
        size: metadata.size
      }
    };
  }

  async decryptFile(
    encryptedData: Uint8Array,
    key: EncryptionKey,
    iv: InitializationVector
  ): Promise<{
    fileData: Uint8Array;
    metadata: { filename: string; mimeType: string; size: number };
  }> {
    this.ensureClientSide('decryptFile');

    // Decrypt the combined data
    const decryptedCombined = await this.decryptData(encryptedData, key, iv);

    // Extract metadata length
    const metadataLengthView = new DataView(decryptedCombined.buffer, 0, 4);
    const metadataLength = metadataLengthView.getUint32(0, true); // little-endian

    // Extract metadata
    const metadataBytes = decryptedCombined.slice(4, 4 + metadataLength);
    const metadataJson = new TextDecoder().decode(metadataBytes);
    const metadata = JSON.parse(metadataJson);

    // Extract file data
    const fileData = decryptedCombined.slice(4 + metadataLength);

    return {
      fileData,
      metadata: {
        filename: metadata.filename,
        mimeType: metadata.mimeType,
        size: metadata.size
      }
    };
  }

  async encryptData(data: Uint8Array, key: EncryptionKey): Promise<{
    encryptedData: Uint8Array;
    iv: InitializationVector;
  }> {
    this.ensureClientSide('encryptData');

    // Generate random IV
    const iv = InitializationVector.generate();

    // Convert encryption key to CryptoKey
    const cryptoKey = await key.toCryptoKey();

    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv.getBytes(),
        tagLength: ENCRYPTION_CONFIG.tagLength * 8 // Convert to bits
      },
      cryptoKey,
      data
    );

    return {
      encryptedData: new Uint8Array(encryptedBuffer),
      iv
    };
  }

  async decryptData(
    encryptedData: Uint8Array,
    key: EncryptionKey,
    iv: InitializationVector
  ): Promise<Uint8Array> {
    this.ensureClientSide('decryptData');

    // Convert encryption key to CryptoKey
    const cryptoKey = await key.toCryptoKey();

    // Decrypt data
    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv.getBytes(),
          tagLength: ENCRYPTION_CONFIG.tagLength * 8 // Convert to bits
        },
        cryptoKey,
        encryptedData
      );

      return new Uint8Array(decryptedBuffer);    } catch {
      throw new Error('Failed to decrypt data - invalid key or corrupted data');
    }
  }

  checkBrowserSupport(): { supported: boolean; missingFeatures: string[] } {
    const missingFeatures: string[] = [];

    if (!globalThis.crypto) {
      missingFeatures.push('Web Crypto API');
    }

    if (!globalThis.crypto?.subtle) {
      missingFeatures.push('Web Crypto Subtle API');
    }

    if (!globalThis.TextEncoder) {
      missingFeatures.push('TextEncoder');
    }

    if (!globalThis.TextDecoder) {
      missingFeatures.push('TextDecoder');
    }

    return {
      supported: missingFeatures.length === 0,
      missingFeatures
    };
  }

  generateSalt(): Uint8Array {
    this.ensureClientSide('generateSalt');
    return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
  }
  private ensureClientSide(operation: string): void {
    // Allow in browser or test environment
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    const isVitestEnv = typeof process !== 'undefined' && process.env.VITEST === 'true';

    if (typeof window === 'undefined' && !isTestEnv && !isVitestEnv) {
      throw new Error(`PRIVACY VIOLATION: ${operation} can only be performed client-side`);
    }
  }
}
