/**
 * 🔒 Encryption Indicator Component
 * 
 * Shows real-time encryption status with privacy-focused design.
 * Uses shared design system components and privacy-first patterns.
 */

'use client';

import { cn, ShieldCheckIcon, AlertCircleIcon, LoadingIcon } from '@/shared/presentation';

export type EncryptionStatus = 'idle' | 'encrypting' | 'encrypted' | 'error';

export interface EncryptionIndicatorProps {
  status: EncryptionStatus;
  progress?: number; // 0-1 for encrypting status
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Privacy-first encryption status indicator
 */
export function EncryptionIndicator({
  status,
  progress = 0,
  message,
  size = 'md',
  showLabel = true,
  className
}: EncryptionIndicatorProps) {
  const variants = {
    idle: {
      icon: LoadingIcon,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      label: 'Ready to encrypt',
      description: 'File will be encrypted with AES-256-GCM'
    },
    encrypting: {
      icon: LoadingIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Encrypting...',
      description: 'Securing your file with zero-knowledge encryption'
    },
    encrypted: {
      icon: ShieldCheckIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Encrypted',
      description: 'File is secured with AES-256-GCM encryption'
    },
    error: {
      icon: AlertCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Encryption failed',
      description: 'Please try again or contact support'
    }
  };

  const sizeVariants = {
    sm: {
      container: 'px-2 py-1',
      icon: 'w-4 h-4',
      text: 'text-xs',
      progress: 'h-1'
    },
    md: {
      container: 'px-3 py-2',
      icon: 'w-5 h-5',
      text: 'text-sm',
      progress: 'h-2'
    },
    lg: {
      container: 'px-4 py-3',
      icon: 'w-6 h-6',
      text: 'text-base',
      progress: 'h-3'
    }
  };

  const variant = variants[status];
  const sizeClasses = sizeVariants[size];
  const IconComponent = variant.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-2 rounded-lg border transition-all duration-200',
        variant.bgColor,
        variant.borderColor,
        sizeClasses.container,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={message || variant.description}
    >
      {/* Icon with animation for encrypting state */}
      <div className="relative">        <IconComponent
        className={cn(
          sizeClasses.icon,
          variant.color,
          status === 'encrypting' && 'animate-pulse',
          'transition-colors duration-200'
        )}
        aria-hidden={true}
      />

        {/* Spinning ring for encrypting state */}
        {status === 'encrypting' && (
          <div className={cn(
            'absolute inset-0 rounded-full border-2 border-transparent border-t-current opacity-60 animate-spin',
            variant.color
          )} />
        )}
      </div>

      {/* Label and progress */}
      <div className="flex-1 min-w-0">
        {showLabel && (
          <div className={cn(
            'font-medium',
            variant.color,
            sizeClasses.text
          )}>
            {message || variant.label}
          </div>
        )}

        {/* Progress bar for encrypting status */}
        {status === 'encrypting' && (
          <div className={cn(
            'w-full bg-gray-200 rounded-full overflow-hidden mt-1',
            sizeClasses.progress
          )}>
            <div
              className={cn(
                'bg-current transition-all duration-300 ease-out',
                variant.color,
                sizeClasses.progress
              )}
              style={{ width: `${Math.round(progress * 100)}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </div>

      {/* Screen reader content */}
      <span className="sr-only">
        {variant.description}
        {status === 'encrypting' && ` - ${Math.round(progress * 100)}% complete`}
      </span>
    </div>
  );
}

/**
 * Zero-Knowledge confirmation badge
 */
export function ZeroKnowledgeIndicator({
  size = 'md',
  className
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeVariants = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center space-x-2 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-medium transition-all duration-200',
        sizeVariants[size],
        className
      )}
      role="status"
      aria-label="Zero-knowledge encryption active"
    >
      <ShieldCheckIcon className="w-4 h-4" aria-hidden={true} />
      <span>Zero-Knowledge</span>
      <span className="sr-only">
        Server cannot decrypt your files. Encryption keys stay on your device.
      </span>
    </div>
  );
}

/**
 * Privacy guarantee display
 */
export function PrivacyGuarantee({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2 text-sm text-gray-600', className)}>
        <ShieldCheckIcon className="w-4 h-4 text-green-600" aria-hidden={true} />
        <span>Server cannot decrypt your files</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg',
      className
    )}>
      <div className="flex items-start space-x-3">
        <ShieldCheckIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden={true} />
        <div>
          <h3 className="font-semibold text-green-800 mb-1">
            🔒 Privacy Guarantee
          </h3>
          <p className="text-sm text-green-700 mb-2">
            Your files are encrypted in your browser before upload. The server cannot decrypt them.
          </p>
          <div className="flex flex-wrap gap-2">
            <ZeroKnowledgeIndicator size="sm" />
            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
              <span>AES-256-GCM</span>
            </div>
            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-600">
              <span>Client-side only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
