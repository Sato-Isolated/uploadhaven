/**
 * Vitest setup file
 * This file is automatically loaded before all tests
 */

import { vi } from 'vitest';

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: vi.fn().mockReturnValue('mock-uuid-' + Date.now()),
    subtle: {
      generateKey: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      deriveBits: vi.fn(),
      deriveKey: vi.fn()
    }
  }
});

// Mock File API for browser environment
global.File = class File {
  constructor(
    public chunks: BlobPart[],
    public name: string,
    public options?: FilePropertyBag
  ) {}
  
  get size() {
    return this.chunks.reduce((size, chunk) => {
      if (typeof chunk === 'string') return size + chunk.length;
      if (chunk instanceof ArrayBuffer) return size + chunk.byteLength;
      return size + (chunk as any).length;
    }, 0);
  }
  
  get type() {
    return this.options?.type || '';
  }
  
  async arrayBuffer(): Promise<ArrayBuffer> {
    const buffer = new ArrayBuffer(this.size);
    return buffer;
  }
  
  async text(): Promise<string> {
    return this.chunks.join('');
  }
} as any;

// Mock FormData
global.FormData = class FormData {
  private data = new Map<string, any>();
  
  append(name: string, value: any) {
    this.data.set(name, value);
  }
  
  get(name: string) {
    return this.data.get(name);
  }
  
  has(name: string) {
    return this.data.has(name);
  }
  
  entries() {
    return this.data.entries();
  }
} as any;

// Mock fetch globally
global.fetch = vi.fn();

// Mock CSS imports
vi.mock('*.css', () => ({}));
vi.mock('*.scss', () => ({}));
vi.mock('*.sass', () => ({}));

// Mock next/server modules
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(public url: string, public init?: RequestInit) {}
    
    async json() {
      return {};
    }
    
    async formData() {
      return new FormData();
    }
    
    headers = new Map();
  },
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Map()
    }))
  }
}));

// Mock environment variables
(process.env as any).NODE_ENV = 'test';
(process.env as any).MONGODB_URI = 'mongodb://localhost:27017/outerdrop-test';
(process.env as any).NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Global test utilities
global.createMockFile = (name: string, content: string, type: string = 'text/plain') => {
  return new File([content], name, { type });
};

// Declare global types for TypeScript
declare global {
  var createMockFile: (name: string, content: string, type?: string) => File;
}
