/**
 * Worker Thread for Parallel Encryption
 * 
 * Handles encryption of file chunks in parallel using worker threads.
 * Uses AES-CTR mode to enable parallel processing while maintaining security.
 */

import { isMainThread, parentPort } from 'worker_threads';
import { createCipheriv, createDecipheriv, pbkdf2 } from 'crypto';
import { promisify } from 'util';

// Keeping pbkdf2Async for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _pbkdf2Async = promisify(pbkdf2);

interface EncryptionTask {
  chunk: Buffer;
  chunkIndex: number;
  key: Buffer;
  iv: Buffer;
  algorithm: string;
}

interface DecryptionTask {
  encryptedChunk: Buffer;
  chunkIndex: number;
  key: Buffer;
  iv: Buffer;
  algorithm: string;
}

if (!isMainThread) {
  // Worker thread code
  parentPort?.on('message', async (task: EncryptionTask | DecryptionTask) => {
    try {
      if ('chunk' in task) {
        // Encryption task
        const result = await encryptChunk(task);
        parentPort?.postMessage({ success: true, result });
      } else {
        // Decryption task
        const result = await decryptChunk(task);
        parentPort?.postMessage({ success: true, result });
      }    } catch (error) {
      parentPort?.postMessage({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}

/**
 * Encrypt a single chunk using AES-CTR mode
 */
async function encryptChunk(task: EncryptionTask): Promise<{
  encryptedChunk: Buffer;
  chunkIndex: number;
}> {
  const { chunk, chunkIndex, key, iv, algorithm } = task;
  
  // For CTR mode, we need to adjust the IV for each chunk
  // This ensures each chunk has a unique counter
  const chunkIV = Buffer.from(iv);
  const counterOffset = chunkIndex * Math.ceil(chunk.length / 16); // 16 bytes per block
  
  // Adjust the counter in the IV (last 8 bytes are typically the counter in CTR mode)
  const counter = chunkIV.readBigUInt64BE(8) + BigInt(counterOffset);
  chunkIV.writeBigUInt64BE(counter, 8);
  
  const cipher = createCipheriv(algorithm, key, chunkIV);
  
  const chunks: Buffer[] = [];
  chunks.push(cipher.update(chunk));
  chunks.push(cipher.final());
  
  return {
    encryptedChunk: Buffer.concat(chunks),
    chunkIndex
  };
}

/**
 * Decrypt a single chunk using AES-CTR mode
 */
async function decryptChunk(task: DecryptionTask): Promise<{
  decryptedChunk: Buffer;
  chunkIndex: number;
}> {
  const { encryptedChunk, chunkIndex, key, iv, algorithm } = task;
  
  // For CTR mode, we need to adjust the IV for each chunk
  const chunkIV = Buffer.from(iv);
  const counterOffset = chunkIndex * Math.ceil(encryptedChunk.length / 16);
  
  const counter = chunkIV.readBigUInt64BE(8) + BigInt(counterOffset);
  chunkIV.writeBigUInt64BE(counter, 8);
  
  const decipher = createDecipheriv(algorithm, key, chunkIV);
  
  const chunks: Buffer[] = [];
  chunks.push(decipher.update(encryptedChunk));
  chunks.push(decipher.final());
  
  return {
    decryptedChunk: Buffer.concat(chunks),
    chunkIndex
  };
}

export type { EncryptionTask, DecryptionTask };
