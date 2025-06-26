import { useCallback, useRef } from 'react';
import type { CryptoWorkerMessage, CryptoWorkerResponse } from '@/workers/crypto.worker';

interface EncryptionResult {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  key: string;
}

interface UseCryptoWorkerResult {
  encryptFile: (file: ArrayBuffer, password?: string) => Promise<EncryptionResult>;
  decryptFile: (encryptedData: ArrayBuffer, iv: Uint8Array, salt: Uint8Array, key: string, password?: string) => Promise<ArrayBuffer>;
  isAvailable: boolean;
}

export function useCryptoWorker(): UseCryptoWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const pendingOperations = useRef<Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>>(new Map());

  const initWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    try {
      // Use Next.js 15 Web Worker support
      workerRef.current = new Worker(new URL('../workers/crypto.worker.ts', import.meta.url), {
        type: 'module'
      });
      
      workerRef.current.onmessage = (event: MessageEvent<CryptoWorkerResponse>) => {
        const { type, id, result, error } = event.data;
        const operation = pendingOperations.current.get(id);
        
        if (!operation) return;
        
        pendingOperations.current.delete(id);
        
        if (type === 'success') {
          operation.resolve(result);
        } else {
          operation.reject(new Error(error || 'Unknown worker error'));
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Crypto worker error:', error);
        // Reject all pending operations
        pendingOperations.current.forEach(({ reject }) => {
          reject(new Error('Worker encountered an error'));
        });
        pendingOperations.current.clear();
      };

      return workerRef.current;
    } catch (error) {
      console.warn('Failed to initialize crypto worker:', error);
      return null;
    }
  }, []);

  const executeOperation = useCallback(<T>(type: 'encrypt' | 'decrypt', data: CryptoWorkerMessage['data']): Promise<T> => {
    return new Promise((resolve, reject) => {
      const worker = initWorker();
      
      if (!worker) {
        reject(new Error('Crypto worker not available'));
        return;
      }

      const id = crypto.randomUUID();
      pendingOperations.current.set(id, { resolve: resolve as (value: unknown) => void, reject });

      const message: CryptoWorkerMessage = {
        type,
        data,
        id,
      };

      worker.postMessage(message);
    });
  }, [initWorker]);

  const encryptFile = useCallback(async (file: ArrayBuffer, password?: string): Promise<EncryptionResult> => {
    return executeOperation<EncryptionResult>('encrypt', { file, password });
  }, [executeOperation]);

  const decryptFile = useCallback(async (
    encryptedData: ArrayBuffer,
    iv: Uint8Array,
    salt: Uint8Array,
    key: string,
    password?: string
  ): Promise<ArrayBuffer> => {
    return executeOperation<ArrayBuffer>('decrypt', { encryptedData, iv, salt, key, password });
  }, [executeOperation]);

  // Check if Web Workers are available
  const isAvailable = typeof Worker !== 'undefined';

  // Cleanup worker on unmount
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    pendingOperations.current.clear();
  }, []);

  // Auto-cleanup (though React should handle this)
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

  return {
    encryptFile,
    decryptFile,
    isAvailable,
  };
}
