import { useState, useEffect, useCallback } from 'react';

export function useDomainTranslation(domain: string, component?: string) {
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadTranslations = async () => {
      const locale = getCurrentLocale(); // 'en', 'fr', 'es'

      try {
        // 1. Charger traductions communes
        const coreCommon = await import(`./core/common/${locale}.json`);
        const coreErrors = await import(`./core/errors/${locale}.json`);
        const coreValidation = await import(`./core/validation/${locale}.json`);

        // 2. Charger traductions du domaine
        const domainTranslations = await import(`./domains/${domain}/${locale}.json`);

        // 3. Charger traductions du composant si spécifié
        const componentTranslations = component
          ? await import(`./components/${component}/${locale}.json`)
          : {};

        // 4. Merger dans l'ordre de priorité (composant > domaine > core)
        setTranslations({
          ...coreCommon.default,
          ...coreErrors.default,
          ...coreValidation.default,
          ...domainTranslations.default,
          ...componentTranslations.default
        });
      } catch (error) {
        console.warn(`Failed to load translations for domain: ${domain}, component: ${component}`, error);
        // Fallback to English or empty object
      }
    };

    loadTranslations();
  }, [domain, component]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let translation = translations[key] || key;

    // Interpolation de paramètres {{param}}
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }

    return translation;
  }, [translations]);

  return { t, translations, isLoaded: Object.keys(translations).length > 0 };
}

// Helper pour obtenir la locale actuelle
function getCurrentLocale(): string {
  // Dans Next.js 15 avec i18n
  if (typeof window !== 'undefined') {
    return window.location.pathname.split('/')[1] || 'en';
  }
  return 'en'; // Fallback
}
