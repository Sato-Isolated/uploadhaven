/**
 * Internationalized security notifications helper
 * This file provides helper functions that combine the security notification utilities
 * with next-intl translation functions
 */

import { getTranslations } from 'next-intl/server';
import {
  createSecurityNotification,
  createSystemSecurityNotification,
  createFileExpirationNotifications,
} from './security-notifications';
import type { SecurityEventType, SecuritySeverity } from '@/types/events';

/**
 * Create a security notification with internationalization support
 * This is a convenience function that automatically gets the translations
 */
export async function createI18nSecurityNotification(
  data: {
    userId: string;
    eventType: SecurityEventType;
    severity: SecuritySeverity;
    details: string;
    metadata?: Record<string, unknown>;
    relatedFileId?: string;
  },
  locale: string = 'en'
): Promise<void> {
  try {
    const t = await getTranslations({
      locale,
      namespace: 'SecurityNotifications',
    });

    // Create a translation function that matches our expected signature
    const translate = (key: string, params?: Record<string, any>) => {
      // Remove the namespace prefix if it exists
      const translationKey = key.replace('SecurityNotifications.', '');
      return t(translationKey, params);
    };

    await createSecurityNotification(data, translate);
  } catch (error) {
    console.error(
      'Failed to create internationalized security notification:',
      error
    );
    // Fallback to English if translation fails
    await createSecurityNotification(data);
  }
}

/**
 * Create system-wide security notifications with internationalization support
 */
export async function createI18nSystemSecurityNotification(
  userIds: string[],
  eventType: SecurityEventType,
  severity: SecuritySeverity,
  details: string,
  metadata?: Record<string, unknown>,
  locale: string = 'en'
): Promise<void> {
  try {
    const t = await getTranslations({
      locale,
      namespace: 'SecurityNotifications',
    });

    const translate = (key: string, params?: Record<string, any>) => {
      const translationKey = key.replace('SecurityNotifications.', '');
      return t(translationKey, params);
    };

    await createSystemSecurityNotification(
      userIds,
      eventType,
      severity,
      details,
      metadata,
      translate
    );
  } catch (error) {
    console.error(
      'Failed to create internationalized system security notification:',
      error
    );
    // Fallback to English if translation fails
    await createSystemSecurityNotification(
      userIds,
      eventType,
      severity,
      details,
      metadata
    );
  }
}

/**
 * Create file expiration notifications with internationalization support
 */
export async function createI18nFileExpirationNotifications(
  locale: string = 'en'
): Promise<void> {
  try {
    const t = await getTranslations({
      locale,
      namespace: 'SecurityNotifications',
    });

    const translate = (key: string, params?: Record<string, any>) => {
      const translationKey = key.replace('SecurityNotifications.', '');
      return t(translationKey, params);
    };

    await createFileExpirationNotifications(translate);
  } catch (error) {
    console.error(
      'Failed to create internationalized file expiration notifications:',
      error
    );
    // Fallback to English if translation fails
    await createFileExpirationNotifications();
  }
}

/**
 * Create security notifications for multiple users with different locales
 * Useful when users have different language preferences
 */
export async function createMultiLocaleSecurityNotifications(
  usersWithLocales: Array<{
    userId: string;
    locale: string;
  }>,
  eventType: SecurityEventType,
  severity: SecuritySeverity,
  details: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Group users by locale for efficiency
  const usersByLocale = usersWithLocales.reduce(
    (acc, { userId, locale }) => {
      if (!acc[locale]) {
        acc[locale] = [];
      }
      acc[locale].push(userId);
      return acc;
    },
    {} as Record<string, string[]>
  );

  // Create notifications for each locale group
  const promises = Object.entries(usersByLocale).map(([locale, userIds]) =>
    createI18nSystemSecurityNotification(
      userIds,
      eventType,
      severity,
      details,
      metadata,
      locale
    )
  );

  await Promise.allSettled(promises);
}
