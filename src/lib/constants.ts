/**
 * Constants and configuration values for UploadHaven
 * Centralized configuration to avoid magic numbers and improve maintainability
 */

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  LARGE_FILE_WARNING_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'audio/mpeg', 'audio/wav',
    'application/pdf', 'text/plain', 'application/zip'
  ] as const,
  SUSPICIOUS_TYPES: [
    'application/x-msdownload',
    'application/x-executable', 
    'application/x-msdos-program'
  ] as const,
  SUSPICIOUS_EXTENSIONS: /\.(exe|bat|com|scr|pif|cmd)$/i,
} as const;

// Expiration Options
export const EXPIRATION_OPTIONS = [
  { value: '1h', label: '1 Hour', ms: 60 * 60 * 1000 },
  { value: '24h', label: '24 Hours', ms: 24 * 60 * 60 * 1000 },
  { value: '7d', label: '7 Days', ms: 7 * 24 * 60 * 60 * 1000 },
  { value: '30d', label: '30 Days', ms: 30 * 24 * 60 * 60 * 1000 },
  { value: 'never', label: 'Never', ms: 0 },
] as const;

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 0.5,
  POLLING_INTERVALS: {
    FAST: 30 * 1000,     // 30 seconds
    NORMAL: 60 * 1000,   // 1 minute  
    SLOW: 5 * 60 * 1000, // 5 minutes
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
  },
} as const;

// Color Schemes
export const COLOR_SCHEMES = {
  CHART_COLORS: [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
  ],
  SEVERITY_COLORS: {
    low: 'text-green-600 dark:text-green-400',
    medium: 'text-yellow-600 dark:text-yellow-400', 
    high: 'text-red-600 dark:text-red-400',
    critical: 'text-red-700 dark:text-red-500'
  },
} as const;

// API Configuration  
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  ENDPOINTS: {
    FILES: '/api/files',
    UPLOAD: '/api/upload',
    STATS: '/api/stats',
    SECURITY: '/api/security',
    ADMIN: '/api/admin',
  },
  CACHE_TIMES: {
    SHORT: 30 * 1000,      // 30 seconds
    MEDIUM: 2 * 60 * 1000, // 2 minutes
    LONG: 5 * 60 * 1000,   // 5 minutes
  },
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  RATE_LIMITS: {
    UPLOAD: { requests: 10, windowMs: 60 * 1000 },      // 10 uploads per minute
    DOWNLOAD: { requests: 50, windowMs: 60 * 1000 },    // 50 downloads per minute
    API: { requests: 100, windowMs: 60 * 1000 },        // 100 API calls per minute
  },
  PASSWORD_RULES: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  QUOTA_LIMITS: {
    VIRUS_TOTAL_DAILY: 1000,
  },
} as const;

// System Information
export const SYSTEM_INFO = {
  UPLOAD_DIRECTORY: '/public/uploads',
  ALLOWED_FILE_TYPES: 'Images, Videos, Audio, Documents, Archives',
  SUPPORTED_FORMATS: {
    images: ['JPEG', 'PNG', 'GIF', 'WebP'],
    videos: ['MP4'],
    audio: ['MP3', 'WAV'],
    documents: ['PDF', 'TXT'],
    archives: ['ZIP'],
  },
} as const;

// Export type for better TypeScript support
export type ExpirationValue = typeof EXPIRATION_OPTIONS[number]['value'];
export type SupportedMimeType = typeof UPLOAD_CONFIG.SUPPORTED_TYPES[number];
export type SeverityLevel = keyof typeof COLOR_SCHEMES.SEVERITY_COLORS;
