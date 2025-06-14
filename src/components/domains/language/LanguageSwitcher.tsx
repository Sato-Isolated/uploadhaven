'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { routing } from '@/i18n/routing';

export default function LanguageSwitcher() {
  const t = useTranslations('Language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.push(pathname, { locale: newLocale });
  };

  const getLanguageName = (locale: string) => {
    switch (locale) {
      case 'en':
        return t('english');
      case 'es':
        return t('spanish');
      case 'fr':
        return t('french');
      default:
        return locale;
    }
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-auto min-w-[120px]">
        <SelectValue placeholder={t('selectLanguage')} />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {getLanguageName(loc)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
