/**
 * Web Worker for cryptographic operations
 * Prevents UI blocking during heavy encryption/decryption
 */

export interface CryptoWorkerMessage {
  type: 'encrypt' | 'decrypt';
  data: {
    file?: ArrayBuffer;
    encryptedData?: ArrayBuffer;
    iv?: Uint8Array;
    salt?: Uint8Array;
    key?: string;
    password?: string;
  };
  id: string;
}

export interface CryptoWorkerResponse {
  type: 'success' | 'error';
  id: string;
  result?: unknown;
  error?: string;
}

const algorithm = 'AES-GCM';
const keyLength = 256;
const ivLength = 12;
const saltLength = 16;

function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(saltLength));
}

function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(ivLength));
}

async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: algorithm,
      length: keyLength,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

async function keyToBase64(key: CryptoKey): Promise<string> {
  const keyData = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(keyData)));
}

async function keyFromBase64(base64Key: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: algorithm },
    false,
    ['encrypt', 'decrypt']
  );
}

async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
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
    { name: algorithm, length: keyLength },
    true,
    ['encrypt', 'decrypt']
  );
}

function combineEncryptedData(encryptedData: ArrayBuffer, iv: Uint8Array, salt: Uint8Array): ArrayBuffer {
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


async function encryptFile(file: ArrayBuffer, password?: string) {
  const salt = generateSalt();
  const iv = generateIV();
  
  let key: CryptoKey;
  if (password) {
    key = await deriveKeyFromPassword(password, salt);
  } else {
    key = await generateKey();
  }

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: algorithm,
      iv,
    },
    key,
    file
  );

  const keyBase64 = await keyToBase64(key);
  const combinedData = combineEncryptedData(encryptedData, iv, salt);

  return {
    encryptedData: combinedData,
    iv,
    salt,
    key: keyBase64,
  };
}

async function decryptFile(encryptedData: ArrayBuffer, iv: Uint8Array, salt: Uint8Array, key: string, password?: string) {
  let cryptoKey: CryptoKey;
  
  if (password) {
    cryptoKey = await deriveKeyFromPassword(password, salt);
  } else {
    cryptoKey = await keyFromBase64(key);
  }

  return crypto.subtle.decrypt(
    {
      name: algorithm,
      iv: iv,
    },
    cryptoKey,
    encryptedData
  );
}

// Worker message handler
self.onmessage = async (event: MessageEvent<CryptoWorkerMessage>) => {
  const { type, data, id } = event.data;

  try {
    let result;

    if (type === 'encrypt') {
      if (!data.file) throw new Error('File data required for encryption');
      result = await encryptFile(data.file, data.password);
    } else if (type === 'decrypt') {
      if (!data.encryptedData || !data.iv || !data.salt || !data.key) {
        throw new Error('All decryption parameters required');
      }
      result = await decryptFile(
        data.encryptedData,
        data.iv,
        data.salt,
        data.key,
        data.password
      );
    } else {
      throw new Error(`Unknown operation type: ${type}`);
    }

    const response: CryptoWorkerResponse = {
      type: 'success',
      id,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: CryptoWorkerResponse = {
      type: 'error',
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
};
