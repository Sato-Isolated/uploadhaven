/**
 * File Type Detection Utilities
 * 
 * Detect file type and suggest appropriate filename based on content analysis.
 * Used for zero-knowledge file downloads when original metadata is not available.
 */

/**
 * File signature patterns for common file types
 */
const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF],
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50],
  ],
  
  // Documents
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
  'application/zip': [
    [0x50, 0x4B, 0x03, 0x04],
    [0x50, 0x4B, 0x05, 0x06],
    [0x50, 0x4B, 0x07, 0x08],
  ],
  
  // Office documents (also ZIP-based)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04], // .docx
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    [0x50, 0x4B, 0x03, 0x04], // .xlsx
  ],
  
  // Text files (UTF-8 BOM)
  'text/plain': [
    [0xEF, 0xBB, 0xBF], // UTF-8 BOM
  ],
  
  // Audio
  'audio/mpeg': [
    [0xFF, 0xFB], // MP3
    [0xFF, 0xF3], // MP3
    [0xFF, 0xF2], // MP3
  ],
  'audio/wav': [
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x41, 0x56, 0x45],
  ],
  
  // Video
  'video/mp4': [
    [null, null, null, null, 0x66, 0x74, 0x79, 0x70], // ftyp
  ],
  'video/webm': [
    [0x1A, 0x45, 0xDF, 0xA3],
  ],
} as const;

/**
 * File extensions for detected MIME types
 */
const MIME_TO_EXTENSION = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
} as const;

/**
 * Detect file type from binary content
 */
export function detectFileType(data: Uint8Array): {
  mimeType: string;
  extension: string;
  confidence: 'high' | 'medium' | 'low';
} {
  // Check binary signatures
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const signature of signatures) {
      if (matchesSignature(data, signature)) {
        return {
          mimeType,
          extension: MIME_TO_EXTENSION[mimeType as keyof typeof MIME_TO_EXTENSION] || '.bin',
          confidence: 'high'
        };
      }
    }
  }
  
  // Check if it looks like text
  if (isLikelyText(data)) {
    return {
      mimeType: 'text/plain',
      extension: '.txt',
      confidence: 'medium'
    };
  }
  
  // Default fallback
  return {
    mimeType: 'application/octet-stream',
    extension: '.bin',
    confidence: 'low'
  };
}

/**
 * Check if binary data matches a signature pattern
 */
function matchesSignature(data: Uint8Array, signature: readonly (number | null)[]): boolean {
  if (data.length < signature.length) {
    return false;
  }
  
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] !== null && data[i] !== signature[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Heuristic to detect if content is likely text
 */
function isLikelyText(data: Uint8Array): boolean {
  if (data.length === 0) return false;
  
  // Sample first 1KB for analysis
  const sampleSize = Math.min(data.length, 1024);
  const sample = data.slice(0, sampleSize);
  
  let printableChars = 0;
  let totalChars = 0;
  
  for (const byte of sample) {
    totalChars++;
    
    // ASCII printable characters (32-126) + common whitespace (9, 10, 13)
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      printableChars++;
    }
    // UTF-8 sequences are also considered printable
    else if (byte >= 128) {
      printableChars++;
    }
  }
  
  // If more than 85% of characters are printable, likely text
  return (printableChars / totalChars) > 0.85;
}

/**
 * Generate a smart filename based on file content and file ID
 */
export function generateSmartFilename(
  fileId: string,
  data: Uint8Array,
  fallbackName?: string
): string {
  const detected = detectFileType(data);
  
  // If we have a fallback name with extension, use it
  if (fallbackName && fallbackName.includes('.')) {
    return fallbackName;
  }
  
  // Generate filename based on detection
  const baseName = fallbackName || `downloadhaven-${fileId}`;
  return `${baseName}${detected.extension}`;
}

/**
 * Get user-friendly type description
 */
export function getFileTypeDescription(mimeType: string): string {
  const descriptions = {
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'application/pdf': 'PDF Document',
    'application/zip': 'ZIP Archive',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'text/plain': 'Text File',
    'audio/mpeg': 'MP3 Audio',
    'audio/wav': 'WAV Audio',
    'video/mp4': 'MP4 Video',
    'video/webm': 'WebM Video',
    'application/octet-stream': 'Binary File',
  };
  
  return descriptions[mimeType as keyof typeof descriptions] || 'Unknown File';
}
