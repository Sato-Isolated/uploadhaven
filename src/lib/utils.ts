import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import bcrypt from "bcryptjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique identifier for React keys
 * @returns string - A unique identifier
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Build full short URL for sharing
export function buildShortUrl(shortId: string, baseUrl?: string): string {
  const base =
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${base}/s/${shortId}`;
}

// Validate custom alias format
export function validateCustomAlias(alias: string): {
  valid: boolean;
  error?: string;
} {
  // Check length (3-20 characters)
  if (alias.length < 3 || alias.length > 20) {
    return {
      valid: false,
      error: "Custom alias must be between 3 and 20 characters",
    };
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    return {
      valid: false,
      error:
        "Custom alias can only contain letters, numbers, hyphens, and underscores",
    };
  }

  // Check that it doesn't start with reserved prefixes
  const reservedPrefixes = ["api", "admin", "auth", "www", "app"];
  if (
    reservedPrefixes.some((prefix) => alias.toLowerCase().startsWith(prefix))
  ) {
    return {
      valid: false,
      error: "Custom alias cannot start with reserved words",
    };
  }

  return { valid: true };
}

/**
 * Hash a password using bcrypt
 * @param password - The plain text password to hash
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Strong hashing
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password - The plain text password to verify
 * @param hash - The hash to verify against
 * @returns Promise<boolean> - True if password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * @param password - The password to validate
 * @returns Object with validation result and error message if invalid
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  // Check minimum length
  if (password.length < 6) {
    return {
      valid: false,
      error: "Password must be at least 6 characters long",
    };
  }

  // Check maximum length (to prevent DoS attacks)
  if (password.length > 128) {
    return {
      valid: false,
      error: "Password must be less than 128 characters long",
    };
  }

  return { valid: true };
}

// File signature mappings for security validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP container)
  "image/bmp": [[0x42, 0x4d]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  "video/mp4": [[0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]],
  "video/webm": [[0x1a, 0x45, 0xdf, 0xa3]],
  "audio/mp3": [
    [0xff, 0xfb],
    [0xff, 0xf3],
    [0xff, 0xf2],
  ],
  "audio/wav": [[0x52, 0x49, 0x46, 0x46]],
  "audio/ogg": [[0x4f, 0x67, 0x67, 0x53]],
  "application/zip": [
    [0x50, 0x4b, 0x03, 0x04],
    [0x50, 0x4b, 0x05, 0x06],
  ],
  "application/x-rar-compressed": [[0x52, 0x61, 0x72, 0x21]],
  "application/x-7z-compressed": [[0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]],
};

// Dangerous file extensions that should be blocked
const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".scr",
  ".pif",
  ".com",
  ".vbs",
  ".js",
  ".jar",
  ".msi",
  ".dll",
  ".app",
  ".deb",
  ".rpm",
  ".dmg",
  ".pkg",
  ".sh",
  ".ps1",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".cgi",
  ".pl",
  ".py",
  ".rb",
];

// Maximum file sizes by type (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
  "image/*": 50 * 1024 * 1024, // 50MB for images
  "video/*": 500 * 1024 * 1024, // 500MB for videos
  "audio/*": 100 * 1024 * 1024, // 100MB for audio
  "application/pdf": 50 * 1024 * 1024, // 50MB for PDFs
  "text/*": 10 * 1024 * 1024, // 10MB for text files
  default: 100 * 1024 * 1024, // 100MB default
};

/**
 * Validate file signature against expected MIME type
 * @param buffer - File buffer (first few bytes)
 * @param mimeType - Expected MIME type
 * @returns boolean - True if signature matches expected type
 */
export function validateFileSignature(
  buffer: Uint8Array,
  mimeType: string
): boolean {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return true; // Allow unknown types (text files, etc.)

  return signatures.some((signature) => {
    if (buffer.length < signature.length) return false;
    return signature.every((byte, index) => buffer[index] === byte);
  });
}

/**
 * Advanced file validation with security checks
 * @param file - File to validate
 * @param options - Validation options
 * @returns Promise<ValidationResult> - Validation result with detailed errors
 */
export async function validateFileAdvanced(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    blockedTypes?: string[];
    checkSignature?: boolean;
    allowExecutables?: boolean;
  } = {}
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    extension: string;
  };
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    extension: file.name.toLowerCase().substring(file.name.lastIndexOf(".")),
  };

  // Check file size
  const maxSize = options.maxSize || getMaxFileSize(fileInfo.type);
  if (file.size > maxSize) {
    errors.push(
      `File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`
    );
  }

  // Check for zero-byte files
  if (file.size === 0) {
    errors.push("File appears to be empty");
  }

  // Check for dangerous extensions
  if (
    !options.allowExecutables &&
    DANGEROUS_EXTENSIONS.includes(fileInfo.extension)
  ) {
    errors.push(
      `File type ${fileInfo.extension} is not allowed for security reasons`
    );
  }

  // Check allowed types
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some((allowedType) => {
      if (allowedType.endsWith("/*")) {
        return fileInfo.type.startsWith(allowedType.slice(0, -1));
      }
      return fileInfo.type === allowedType;
    });

    if (!isAllowed) {
      errors.push(`File type ${fileInfo.type} is not allowed`);
    }
  }

  // Check blocked types
  if (options.blockedTypes && options.blockedTypes.length > 0) {
    const isBlocked = options.blockedTypes.some((blockedType) => {
      if (blockedType.endsWith("/*")) {
        return fileInfo.type.startsWith(blockedType.slice(0, -1));
      }
      return fileInfo.type === blockedType;
    });

    if (isBlocked) {
      errors.push(`File type ${fileInfo.type} is blocked`);
    }
  }

  // Validate file signature if requested
  if (options.checkSignature !== false && file.size > 0) {
    try {
      const buffer = new Uint8Array(await file.slice(0, 32).arrayBuffer());

      if (!validateFileSignature(buffer, fileInfo.type)) {
        errors.push("File signature does not match the declared file type");
      }
    } catch {
      warnings.push("Could not verify file signature");
    }
  }

  // Additional security checks

  // Check for suspicious file names
  if (
    fileInfo.name.includes("..") ||
    fileInfo.name.includes("/") ||
    fileInfo.name.includes("\\")
  ) {
    errors.push("File name contains invalid characters");
  }

  // Check for excessively long file names
  if (fileInfo.name.length > 255) {
    errors.push("File name is too long");
  }

  // Check for files without extensions (potential security risk)
  if (!fileInfo.extension && fileInfo.type === "application/octet-stream") {
    warnings.push(
      "File has no extension and unknown type - proceed with caution"
    );
  }

  // Check for double extensions (e.g., .jpg.exe)
  const extensionCount = (fileInfo.name.match(/\./g) || []).length;
  if (extensionCount > 1) {
    const parts = fileInfo.name.split(".");
    if (parts.length > 2) {
      const secondLastExt = "." + parts[parts.length - 2].toLowerCase();
      if (DANGEROUS_EXTENSIONS.includes(secondLastExt)) {
        errors.push("File has suspicious double extension");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileInfo,
  };
}

/**
 * Get maximum file size for a given MIME type
 * @param mimeType - MIME type of the file
 * @returns number - Maximum file size in bytes
 */
function getMaxFileSize(mimeType: string): number {
  for (const [type, size] of Object.entries(MAX_FILE_SIZES)) {
    if (type === "default") continue;

    if (type.endsWith("/*")) {
      if (mimeType.startsWith(type.slice(0, -1))) {
        return size;
      }
    } else if (mimeType === type) {
      return size;
    }
  }

  return MAX_FILE_SIZES.default;
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns string - Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Sanitize filename for safe storage
 * @param filename - Original filename
 * @returns string - Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*]/g, "_") // Replace Windows-forbidden chars
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .replace(/^\.+/, "") // Remove leading dots
    .replace(/\.+$/, "") // Remove trailing dots
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .trim();

  // Ensure filename isn't empty
  if (!sanitized) {
    sanitized = "unnamed_file";
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    const name = sanitized.substring(0, sanitized.lastIndexOf("."));
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}

/**
 * Check if file type is safe for preview
 * @param mimeType - MIME type of the file
 * @returns boolean - True if safe to preview
 */
export function isSafeForPreview(mimeType: string): boolean {
  const safeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/mpeg",
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "application/json",
    "application/xml",
    "application/pdf",
  ];

  return safeTypes.includes(mimeType) || mimeType.startsWith("text/");
}
