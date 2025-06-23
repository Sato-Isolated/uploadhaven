/**
 * 🎨 Shared UI Utilities for UploadHaven
 * 
 * Privacy-first design system utilities for the DDD architecture.
 * Follows the design standards outlined in UX-DESIGN.adoc
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for merging className strings with Tailwind CSS
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Privacy-focused design tokens and theme variables
 */
export const designTokens = {
  colors: {
    // Privacy-First Brand Colors
    privacy: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6', // Primary blue
      600: '#2563eb', // Darker blue
      700: '#1d4ed8', // Privacy blue
      900: '#1e3a8a'
    },
    encryption: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981', // Encryption green
      600: '#059669', // Active encryption
      700: '#047857'
    },
    anonymous: {
      50: '#faf5ff',
      100: '#f3e8ff',
      500: '#8b5cf6', // Anonymous purple
      600: '#7c3aed',
      700: '#6d28d9'
    },
    temporal: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b', // TTL amber
      600: '#d97706', // Warning amber
      700: '#b45309'
    }
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem' // 64px
  },
  radius: {
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    full: '9999px' // Fully rounded
  }
} as const;

/**
 * Privacy state indicator utilities
 */
export const privacyStates = {
  'zero-knowledge': {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Zero-Knowledge',
    description: 'Server cannot decrypt your files'
  },
  encrypted: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Encrypted',
    description: 'File is encrypted with AES-256-GCM'
  },
  anonymous: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Anonymous',
    description: 'No personal data required or stored'
  },
  temporary: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Temporary',
    description: 'Files auto-delete after expiration'
  }
} as const;

/**
 * Accessibility utilities
 */
export const a11y = {
  /**
   * Generate ARIA labels for privacy indicators
   */
  privacyLabel: (level: keyof typeof privacyStates, description?: string) =>
    `Privacy status: ${description || privacyStates[level].description}`,

  /**
   * Screen reader only text utility
   */
  srOnly: 'sr-only',

  /**
   * Focus styles for keyboard navigation
   */
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-privacy-500 focus:ring-offset-2'
} as const;

/**
 * Animation utilities (respects prefers-reduced-motion)
 */
export const animations = {
  'encryption-pulse': 'animate-pulse',
  'privacy-fade': 'transition-opacity duration-300 ease-in-out',
  'smooth-transition': 'transition-all duration-200 ease-in-out'
} as const;

export type PrivacyState = keyof typeof privacyStates;
export type DesignToken = typeof designTokens;
