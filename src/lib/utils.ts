import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { UPLOAD_CONFIG, SECURITY_CONFIG } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Build full short URL for sharing
export function buildShortUrl(shortId: string, baseUrl?: string): string {
  const base =
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${base}/s/${shortId}`;
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
 * Extract client IP address from Next.js request
 * @param request - NextRequest object
 * @returns string - Client IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP.trim();
  }

  return "127.0.0.1";
}

// Advanced file validation
export function validateFileAdvanced(file: File): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${formatFileSize(maxSize)} limit`);
  }

  // Check for suspicious file types
  const suspiciousTypes = [
    "application/x-msdownload",
    "application/x-executable",
    "application/x-msdos-program",
  ];

  if (suspiciousTypes.includes(file.type)) {
    errors.push("File type not allowed for security reasons");
  }

  // Warning for large files
  if (file.size > 10 * 1024 * 1024) {
    warnings.push("Large file size may impact upload performance");
  }

  // Check file name for suspicious patterns
  const suspiciousPatterns = /\.(exe|bat|com|scr|pif|cmd)$/i;
  if (suspiciousPatterns.test(file.name)) {
    errors.push("File extension not allowed");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format date for display in components
 * @param date - Date string or Date object
 * @returns string - Formatted date
 */
export function formatDisplayDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date and time for detailed display
 * @param date - Date string or Date object
 * @returns string - Formatted date and time
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Calculate percentage and format it
 * @param value - Current value
 * @param total - Total value
 * @returns string - Formatted percentage
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

/**
 * Generate a unique ID for components
 * @param prefix - Optional prefix for the ID
 * @returns string - Unique ID
 */
export function generateUniqueId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safely parse JSON with fallback
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns T - Parsed object or fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Debounce function for search and input handling
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Function - Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if a file type is supported
 * @param mimeType - MIME type of the file
 * @returns boolean - Whether the file type is supported
 */
export function isSupportedFileType(mimeType: string): boolean {
  const supportedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "audio/mpeg",
    "audio/wav",
    "application/pdf",
    "text/plain",
    "application/zip",
  ];
  return supportedTypes.includes(mimeType);
}

/**
 * Get file type category from MIME type
 * @param mimeType - MIME type of the file
 * @returns string - File type category
 */
export function getFileTypeCategory(
  mimeType: string
):
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf" || mimeType === "text/plain")
    return "document";
  if (mimeType === "application/zip") return "archive";
  return "other";
}
