export interface CryptoService {
  generateKey(password?: string, salt?: Uint8Array): Promise<CryptoKey>;
  generateSalt(): Uint8Array;
  generateIV(): Uint8Array;
  encrypt(data: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer>;
  decrypt(encryptedData: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<ArrayBuffer>;
  deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey>;
  encryptFile(file: ArrayBuffer, password?: string): Promise<EncryptionResult>;
  decryptFile(encryptedData: ArrayBuffer, iv: Uint8Array, salt: Uint8Array, password?: string): Promise<ArrayBuffer>;
}

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
}

export class InvalidPasswordError extends Error {
  constructor() {
    super('Invalid password provided for file decryption');
    this.name = 'InvalidPasswordError';
  }
}

export class EncryptionError extends Error {
  constructor(message: string) {
    super(`Encryption error: ${message}`);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(`Decryption error: ${message}`);
    this.name = 'DecryptionError';
  }
}
