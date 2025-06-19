// utils.ts - Utility functions for files management (SRP)

import type { ExpirationStatus } from './types';

/**
 * Calculate expiration status for a file
 * @param expiresAt - Expiration date string or null
 * @param t - Translation function
 * @returns ExpirationStatus object
 */
export function getExpirationStatus(
  expiresAt?: string | null,
  t?: (key: string, params?: Record<string, unknown>) => string
): ExpirationStatus {
  if (!expiresAt) {
    return {
      text: t?.('neverExpires') || 'Never expires',
      variant: 'secondary' as const,
      expired: false,
      isExpiringSoon: false,
      timeLeft: '',
    };
  }

  const now = new Date();
  const expiration = new Date(expiresAt);
  const timeLeft = expiration.getTime() - now.getTime();

  if (timeLeft <= 0) {
    return {
      text: t?.('expired') || 'Expired',
      variant: 'destructive' as const,
      expired: true,
      isExpiringSoon: false,
      timeLeft: '',
    };
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return {
      text: t?.('expiresInDays', { count: days }) || `Expires in ${days} day${days > 1 ? 's' : ''}`,
      variant: days <= 1 ? ('destructive' as const) : ('secondary' as const),
      expired: false,
      isExpiringSoon: days <= 1,
      timeLeft: `${days} ${days > 1 ? (t?.('days') || 'days') : (t?.('day') || 'day')}`,
    };
  } else if (hours > 0) {
    return {
      text: t?.('expiresInHours', { count: hours }) || `Expires in ${hours} hour${hours > 1 ? 's' : ''}`,
      variant: hours <= 2 ? ('destructive' as const) : ('secondary' as const),
      expired: false,
      isExpiringSoon: hours <= 2,
      timeLeft: `${hours} ${hours > 1 ? (t?.('hours') || 'hours') : (t?.('hour') || 'hour')}`,
    };
  } else {
    const minutes = Math.floor(timeLeft / (1000 * 60));
    return {
      text: t?.('expiresInMinutes', { count: minutes }) || `Expires in ${minutes} minute${minutes > 1 ? 's' : ''}`,
      variant: 'destructive' as const,
      expired: false,
      isExpiringSoon: true,
      timeLeft: `${minutes} ${minutes > 1 ? (t?.('minutes') || 'minutes') : (t?.('minute') || 'minute')}`,
    };
  }
}
