import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Load messages from multiple files
  const messages = {
    // Keep existing structure from main file
    ...(await import(`../../messages/${locale}.json`)).default,
  };
  // Try to load specific namespace files
  try {
    const adminMessages = (await import(`../../messages/${locale}/Admin.json`)).default;
    messages.Admin = adminMessages;
  } catch {
    // Fallback to existing Admin section if separate file doesn't exist
    console.warn(`Admin translations not found for locale ${locale}, using fallback`);
  }

  return {
    locale,
    messages,
  };
});
