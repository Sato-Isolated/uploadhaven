import '@testing-library/jest-dom'
import { beforeAll, vi } from 'vitest'

// Simple File polyfill for Node.js testing
class MockFile {
  public name: string;
  public type: string;
  public size: number;
  private _content: ArrayBuffer; constructor(content: (string | ArrayBuffer | Uint8Array)[] | ArrayBuffer | Uint8Array, name: string, options?: { type?: string }) {
    this.name = name;
    this.type = options?.type || '';

    if (content instanceof ArrayBuffer) {
      this._content = content;
      this.size = content.byteLength;
    } else if (content instanceof Uint8Array) {
      // Properly copy the Uint8Array to ArrayBuffer
      const buffer = content.buffer;
      if (buffer instanceof ArrayBuffer) {
        this._content = buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
      } else {
        // Handle SharedArrayBuffer case by creating a new ArrayBuffer
        const newBuffer = new ArrayBuffer(content.length);
        new Uint8Array(newBuffer).set(content);
        this._content = newBuffer;
      }
      this.size = content.length;
    } else if (Array.isArray(content)) {
      // Check if array contains ArrayBuffer (File constructor pattern)
      if (content.length === 1 && content[0] instanceof ArrayBuffer) {
        this._content = content[0];
        this.size = content[0].byteLength;
      } else if (content.length === 1 && content[0] instanceof Uint8Array) {
        const uint8Array = content[0];
        const buffer = uint8Array.buffer;
        if (buffer instanceof ArrayBuffer) {
          this._content = buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength);
        } else {
          const newBuffer = new ArrayBuffer(uint8Array.length);
          new Uint8Array(newBuffer).set(uint8Array);
          this._content = newBuffer;
        }
        this.size = uint8Array.length;
      } else {
        // Handle string array (typical File constructor)
        const text = content.map(c => typeof c === 'string' ? c : '').join('');
        const encoder = new TextEncoder();
        const encoded = encoder.encode(text);
        this._content = encoded.buffer instanceof ArrayBuffer ? encoded.buffer : new ArrayBuffer(encoded.length);
        if (!(encoded.buffer instanceof ArrayBuffer)) {
          new Uint8Array(this._content).set(encoded);
        }
        this.size = encoded.length;
      }
    } else {
      // Handle string content
      const encoder = new TextEncoder();
      const encoded = encoder.encode(content as string);
      this._content = encoded.buffer instanceof ArrayBuffer ? encoded.buffer : new ArrayBuffer(encoded.length);
      if (!(encoded.buffer instanceof ArrayBuffer)) {
        new Uint8Array(this._content).set(encoded);
      }
      this.size = encoded.length;
    }
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this._content;
  }

  async text(): Promise<string> {
    const decoder = new TextDecoder();
    return decoder.decode(this._content);
  }

  slice(start?: number, end?: number, contentType?: string): MockFile {
    const sliced = this._content.slice(start, end);
    return new MockFile(sliced, this.name, { type: contentType || this.type });
  }

  toString(): string {
    return `MockFile{ name: '${this.name}', size: ${this.size}, type: '${this.type}' }`;
  }
}

// @ts-ignore
global.File = MockFile;

// Simple crypto polyfill for testing
function simpleHash(input: string | Uint8Array): number {
  let hash = 0;
  const str = typeof input === 'string' ? input : Array.from(input).join(',');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function generateDeterministicBytes(seed: number, length: number): Uint8Array {
  const result = new Uint8Array(length);
  let current = seed;
  for (let i = 0; i < length; i++) {
    current = (current * 9301 + 49297) % 233280; // Linear congruential generator
    result[i] = (current / 233280) * 256;
  }
  return result;
}

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }, randomUUID: () => {
      // Generate a proper UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const hex = '0123456789abcdef';
      let uuid = '';
      for (let i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
          uuid += '-';
        } else if (i === 14) {
          uuid += '4'; // version 4
        } else if (i === 19) {
          uuid += hex[Math.floor(Math.random() * 4) + 8]; // variant bits
        } else {
          uuid += hex[Math.floor(Math.random() * 16)];
        }
      }
      return uuid;
    },
    subtle: {
      importKey: vi.fn().mockImplementation(async (
        format: string,
        keyData: ArrayBuffer | Uint8Array,
        algorithm: any,
        extractable: boolean,
        keyUsages: string[]
      ) => {
        // Mock CryptoKey with deterministic hash of key data
        const keyArray = keyData instanceof ArrayBuffer ? new Uint8Array(keyData) : keyData;
        const keyHash = simpleHash(keyArray);
        return {
          type: 'secret',
          extractable,
          algorithm,
          usages: keyUsages,
          _keyData: keyData,
          _keyHash: keyHash
        };
      }),

      exportKey: vi.fn().mockImplementation(async (format: string, key: any) => {
        return key._keyData || new Uint8Array(32).buffer;
      }),

      encrypt: vi.fn().mockImplementation(async (
        algorithm: any,
        key: any,
        data: ArrayBuffer
      ) => {
        // Mock encryption - use key hash and IV to generate deterministic but different output
        const input = new Uint8Array(data);
        const keyHash = key._keyHash || 12345;
        const iv = algorithm.iv ? new Uint8Array(algorithm.iv) : new Uint8Array(12);
        const ivHash = simpleHash(iv);

        const output = new Uint8Array(input.length + 16); // +16 for GCM auth tag

        // XOR input with key-derived pattern
        for (let i = 0; i < input.length; i++) {
          const keyByte = ((keyHash + ivHash + i) * 7) % 256;
          output[i] = input[i] ^ keyByte;
        }

        // Add deterministic auth tag
        for (let i = input.length; i < output.length; i++) {
          output[i] = ((keyHash + ivHash + i) * 11) % 256;
        }

        return output.buffer as ArrayBuffer;
      }), decrypt: vi.fn().mockImplementation(async (
        algorithm: any,
        key: any,
        data: ArrayBuffer
      ) => {
        // Mock decryption - reverse the encryption process
        const input = new Uint8Array(data);
        if (input.length < 16) {
          throw new Error('Invalid encrypted data');
        }

        const keyHash = key._keyHash || 12345;
        const iv = algorithm.iv ? new Uint8Array(algorithm.iv) : new Uint8Array(12);
        const ivHash = simpleHash(iv);

        // Verify auth tag (last 16 bytes) to detect wrong key
        const expectedAuthTag = [];
        for (let i = 0; i < 16; i++) {
          expectedAuthTag.push(((keyHash + ivHash + input.length - 16 + i) * 11) % 256);
        }

        const actualAuthTag = Array.from(input.slice(-16));
        const authTagMatches = expectedAuthTag.every((byte, i) => byte === actualAuthTag[i]);

        if (!authTagMatches) {
          throw new Error('The provided AuthenticationTag is invalid.');
        }

        const output = new Uint8Array(input.length - 16);

        // Reverse XOR with key-derived pattern
        for (let i = 0; i < output.length; i++) {
          const keyByte = ((keyHash + ivHash + i) * 7) % 256;
          output[i] = input[i] ^ keyByte;
        }

        return output.buffer as ArrayBuffer;
      }),

      deriveBits: vi.fn().mockImplementation(async (
        algorithm: any,
        baseKey: any,
        length: number
      ) => {
        // Mock key derivation with password and salt awareness
        const password = algorithm.salt ? simpleHash(new Uint8Array(algorithm.salt)) : 12345;
        const iterations = algorithm.iterations || 100000;
        const baseKeyHash = baseKey._keyHash || 54321;

        // Combine all inputs for deterministic but different output
        const seed = baseKeyHash + password + iterations;
        return generateDeterministicBytes(seed, length / 8).buffer;
      }),

      deriveKey: vi.fn().mockImplementation(async (
        algorithm: any,
        baseKey: any,
        derivedKeyType: any,
        extractable: boolean,
        keyUsages: string[]
      ) => {
        // Mock derived key with password and salt awareness
        const password = algorithm.salt ? simpleHash(new Uint8Array(algorithm.salt)) : 12345;
        const iterations = algorithm.iterations || 100000;
        const baseKeyHash = baseKey._keyHash || 54321;

        // Combine all inputs for deterministic but different output
        const seed = baseKeyHash + password + iterations;
        const keyData = generateDeterministicBytes(seed, 32);

        return {
          type: 'secret',
          extractable,
          algorithm: derivedKeyType,
          usages: keyUsages,
          _keyData: keyData,
          _keyHash: simpleHash(keyData)
        };
      }),

      generateKey: vi.fn().mockImplementation(async (
        algorithm: any,
        extractable: boolean,
        keyUsages: string[]
      ) => {
        // Mock key generation
        const keyData = new Uint8Array(32);
        global.crypto.getRandomValues(keyData);
        return {
          type: 'secret',
          extractable,
          algorithm,
          usages: keyUsages,
          _keyData: keyData,
          _keyHash: simpleHash(keyData)
        };
      })
    }
  }
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
  default: (fn: any) => {
    const Component = fn()
    Component.displayName = 'MockDynamic'
    return Component
  },
}))

// Setup global mocks
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))  // Mock crypto
  if (!global.crypto) {
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: (arr: any) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256)
          }
          return arr
        },
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
        subtle: {
          importKey: vi.fn().mockResolvedValue({ type: 'secret' }),
          deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
          encrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
            // Return a mock encrypted result with the original data prefixed by some fake IV
            const iv = new Uint8Array(12).fill(1);
            const encrypted = new Uint8Array(data.byteLength + iv.length);
            encrypted.set(iv);
            encrypted.set(new Uint8Array(data), iv.length);
            return encrypted.buffer;
          }),
          decrypt: vi.fn().mockImplementation(async (algorithm, key, data) => {
            // Extract the original data (skip the fake IV)
            const dataArray = new Uint8Array(data);
            return dataArray.slice(12).buffer;
          })
        }
      },
    })
  } else {
    // Ensure randomUUID is available even if crypto exists
    if (!global.crypto.randomUUID) {
      (global.crypto as any).randomUUID = () => 'test-uuid-' + Math.random().toString(36).substr(2, 9);
    }
  }

  // Mock atob and btoa for base64 operations (required for EncryptionKey)
  if (!global.atob) {
    global.atob = (str: string) => {
      return Buffer.from(str, 'base64').toString('binary')
    }
  }

  if (!global.btoa) {
    global.btoa = (str: string) => {
      return Buffer.from(str, 'binary').toString('base64')
    }
  }

  // Mock fetch if not available
  if (!global.fetch) {
    global.fetch = vi.fn()
  }
})
