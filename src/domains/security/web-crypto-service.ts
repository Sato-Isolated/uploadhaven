import { CryptoService, EncryptionResult, EncryptionError, DecryptionError } from './crypto-service';

export class WebCryptoService implements CryptoService {
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;
  private readonly ivLength = 12;
  private readonly saltLength = 16;

  generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.saltLength));
  }

  generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(this.ivLength));
  }

  async generateKey(password?: string, salt?: Uint8Array): Promise<CryptoKey> {
    if (password && salt) {
      return this.deriveKeyFromPassword(password, salt);
    }

    return crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: this.algorithm, length: this.keyLength },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      throw new EncryptionError(`Failed to derive key from password: ${error}`);
    }
  }

  async encrypt(data: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
    try {
      return crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv,
        },
        key,
        data
      );
    } catch (error) {
      throw new EncryptionError(`Failed to encrypt data: ${error}`);
    }
  }

  async decrypt(encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer> {
    try {
      return crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv,
        },
        key,
        encryptedData
      );
    } catch (error) {
      throw new DecryptionError(`Failed to decrypt data: ${error}`);
    }
  }

  async encryptFile(file: ArrayBuffer, password?: string): Promise<EncryptionResult> {
    const salt = this.generateSalt();
    const iv = this.generateIV();
    // Use a default password if none provided to ensure reproducible encryption
    const effectivePassword = password || 'default-encryption-key';
    const key = await this.generateKey(effectivePassword, salt);
    
    const encryptedData = await this.encrypt(file, key, iv);
    
    return {
      encryptedData,
      iv,
      salt,
    };
  }

  async decryptFile(
    encryptedData: ArrayBuffer,
    iv: Uint8Array,
    salt: Uint8Array,
    password?: string
  ): Promise<ArrayBuffer> {
    // Use the same default password if none provided
    const effectivePassword = password || 'default-encryption-key';
    const key = await this.generateKey(effectivePassword, salt);
    return this.decrypt(encryptedData, key, iv);
  }
}
