/**
 * Client-side cryptography service for Zero Knowledge file encryption
 * This ensures the server never sees the encryption key
 */

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  key: string; // Base64 encoded key for URL fragment
}

export interface DecryptionParams {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  key: string; // Base64 encoded key from URL fragment
}

export class ClientCryptoService {
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

  async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  async keyToBase64(key: CryptoKey): Promise<string> {
    const keyData = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(keyData)));
  }

  async keyFromBase64(base64Key: string): Promise<CryptoKey> {
    const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: this.algorithm },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
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
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  async encryptFile(file: ArrayBuffer, password?: string): Promise<EncryptionResult> {
    const salt = this.generateSalt();
    const iv = this.generateIV();
    
    let key: CryptoKey;
    if (password) {
      key = await this.deriveKeyFromPassword(password, salt);
    } else {
      key = await this.generateKey();
    }

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv,
      },
      key,
      file
    );

    const keyBase64 = await this.keyToBase64(key);

    return {
      encryptedData,
      iv,
      salt,
      key: keyBase64,
    };
  }

  async decryptFile(params: DecryptionParams, password?: string): Promise<ArrayBuffer> {
    let key: CryptoKey;
    
    if (password) {
      // If password provided, derive key from password (ignore the key from URL)
      key = await this.deriveKeyFromPassword(password, params.salt);
    } else {
      // Use the key from URL fragment
      key = await this.keyFromBase64(params.key);
    }

    return crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: params.iv,
      },
      key,
      params.encryptedData
    );
  }

  combineEncryptedData(encryptedData: ArrayBuffer, iv: Uint8Array, salt: Uint8Array): ArrayBuffer {
    const combined = new Uint8Array(4 + salt.length + 4 + iv.length + encryptedData.byteLength);
    let offset = 0;

    // Salt length (4 bytes)
    new DataView(combined.buffer).setUint32(offset, salt.length, true);
    offset += 4;

    // Salt
    combined.set(salt, offset);
    offset += salt.length;

    // IV length (4 bytes)
    new DataView(combined.buffer).setUint32(offset, iv.length, true);
    offset += 4;

    // IV
    combined.set(iv, offset);
    offset += iv.length;

    // Encrypted data
    combined.set(new Uint8Array(encryptedData), offset);

    return combined.buffer;
  }

  separateEncryptedData(combinedData: ArrayBuffer): {
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
    salt: Uint8Array;
  } {
    const view = new DataView(combinedData);
    let offset = 0;

    // Read salt length
    const saltLength = view.getUint32(offset, true);
    offset += 4;

    // Read salt
    const salt = new Uint8Array(combinedData, offset, saltLength);
    offset += saltLength;

    // Read IV length
    const ivLength = view.getUint32(offset, true);
    offset += 4;

    // Read IV
    const iv = new Uint8Array(combinedData, offset, ivLength);
    offset += ivLength;

    // Read encrypted data
    const encryptedData = combinedData.slice(offset);

    return { encryptedData, iv, salt };
  }
}
