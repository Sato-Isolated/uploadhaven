/**
 * 🖼️ Icon Components for UploadHaven
 * 
 * Privacy-first icon system using inline SVG for better performance
 * and design system consistency.
 */

import React from 'react';
import { cn } from './utils';

interface IconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  'aria-hidden'?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
} as const;

/**
 * Shield Check Icon - Zero-Knowledge Protection
 */
export function ShieldCheckIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
      />
    </svg>
  );
}

/**
 * Key Icon - Encryption Key Management
 */
export function KeyIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
      />
    </svg>
  );
}

/**
 * Clock Icon - Temporary Files / TTL
 */
export function ClockIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

/**
 * User Secret Icon - Anonymous Usage
 */
export function UserSecretIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

/**
 * Upload Icon - File Upload
 */
export function UploadIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

/**
 * Loading Spinner Icon - Progress Indication
 */
export function LoadingIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden={ariaHidden}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Check Circle Icon - Success States
 */
export function CheckCircleIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

/**
 * Alert Circle Icon - Warning/Error States
 */
export function AlertCircleIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}

/**
 * Info Icon - Information States
 */
export function InfoIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853L14.25 15M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 6.75h.008v.008H12V6.75Z"
      />
    </svg>
  );
}

/**
 * Copy Icon - Copy to Clipboard
 */
export function CopyIcon({ className, size = 'md', 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <svg
      className={cn(sizeClasses[size], className)}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
      />
    </svg>
  );
}

// Export all icons for easy importing
export const Icons = {
  ShieldCheck: ShieldCheckIcon,
  Key: KeyIcon,
  Clock: ClockIcon,
  UserSecret: UserSecretIcon,
  Upload: UploadIcon,
  Loading: LoadingIcon,
  CheckCircle: CheckCircleIcon,
  AlertCircle: AlertCircleIcon,
  Info: InfoIcon,
  Copy: CopyIcon
} as const;
