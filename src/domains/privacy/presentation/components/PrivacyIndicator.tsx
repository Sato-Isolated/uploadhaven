/**
 * 🛡️ Privacy Indicator Component - Visual Security Status Display
 * 
 * Shows users the current privacy and security status with clear indicators.
 * Part of the privacy-first design system.
 * 
 * @domain privacy
 * @pattern Presentation Component (DDD)
 * @design privacy-first - clear security communication
 */

'use client';

import React from 'react';

/**
 * Privacy indicator types
 */
export type PrivacyIndicatorType = 'encrypted' | 'anonymous' | 'zero-knowledge' | 'temporary';

/**
 * Privacy indicator component props
 */
export interface PrivacyIndicatorProps {
  readonly type: PrivacyIndicatorType;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly showLabel?: boolean;
  readonly description?: string;
  readonly className?: string;
}

/**
 * Privacy indicator configuration
 */
const privacyIndicators = {
  encrypted: {
    icon: '🛡️',
    label: 'Encrypted',
    description: 'File is encrypted with AES-256-GCM',
    colorClass: 'text-green-600',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
  },
  anonymous: {
    icon: '👤',
    label: 'Anonymous',
    description: 'No personal data required or stored',
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
  },
  'zero-knowledge': {
    icon: '🔒',
    label: 'Zero-Knowledge',
    description: 'Server cannot decrypt your files',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  temporary: {
    icon: '⏰',
    label: 'Temporary',
    description: 'Files auto-delete after expiration',
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
} as const;

/**
 * Size configuration
 */
const sizeConfig = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    gap: 'space-x-1',
  },
  md: {
    container: 'px-3 py-2 text-sm',
    icon: 'w-4 h-4',
    gap: 'space-x-2',
  },
  lg: {
    container: 'px-4 py-3 text-base',
    icon: 'w-5 h-5',
    gap: 'space-x-2',
  },
} as const;

/**
 * Privacy Indicator Component
 * 
 * Displays visual indicators for privacy and security status
 */
export function PrivacyIndicator({
  type,
  size = 'md',
  showLabel = true,
  description,
  className = '',
}: PrivacyIndicatorProps) {
  const indicator = privacyIndicators[type];
  const sizeClasses = sizeConfig[size];

  const finalDescription = description || indicator.description;

  return (
    <div
      className={`
        inline-flex items-center
        ${sizeClasses.container}
        ${sizeClasses.gap}
        ${indicator.bgClass}
        ${indicator.borderClass}
        ${indicator.colorClass}
        border rounded-md font-medium
        ${className}
      `}
      role="status"
      aria-live="polite"
      aria-label={`Privacy status: ${finalDescription}`}
    >
      <span
        className={`${sizeClasses.icon} flex-shrink-0 text-center`}
        aria-hidden="true"
      >
        {indicator.icon}
      </span>

      {showLabel && (
        <span className="font-medium">
          {indicator.label}
        </span>
      )}

      {/* Screen reader description */}
      <span className="sr-only">
        {finalDescription}
      </span>
    </div>
  );
}

/**
 * Privacy Status Grid - Multiple indicators together
 */
export interface PrivacyStatusGridProps {
  readonly indicators: PrivacyIndicatorType[];
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

export function PrivacyStatusGrid({
  indicators,
  size = 'sm',
  className = '',
}: PrivacyStatusGridProps) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label="Privacy and security status indicators"
    >
      {indicators.map((type) => (
        <PrivacyIndicator
          key={type}
          type={type}
          size={size}
          showLabel={true}
        />
      ))}
    </div>
  );
}

/**
 * Privacy Banner - Large, prominent privacy guarantee
 */
export interface PrivacyBannerProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly indicators?: PrivacyIndicatorType[];
  readonly className?: string;
}

export function PrivacyBanner({
  title = "🔒 Privacy Protected",
  subtitle = "Your files are encrypted and anonymous by default",
  indicators = ['zero-knowledge', 'anonymous', 'temporary'],
  className = '',
}: PrivacyBannerProps) {
  return (
    <div
      className={`
        bg-gradient-to-r from-blue-50 to-purple-50 
        border border-blue-200 rounded-lg p-6 text-center space-y-4
        ${className}
      `}
      role="banner"
      aria-label="Privacy protection banner"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900">
          {title}
        </h2>
        <p className="text-gray-600">
          {subtitle}
        </p>
      </div>

      <PrivacyStatusGrid
        indicators={indicators}
        size="md"
        className="justify-center"
      />
    </div>
  );
}
