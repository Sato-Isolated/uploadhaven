'use client';

import { Button } from '@/components/ui/button';
import { Home, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export function FilePreviewNavigation() {
  const t = useTranslations('FilePreview');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const handleGoBack = () => {
    if (session?.user) {
      // If user is logged in, return to dashboard
      router.push(`/${locale}/dashboard`);
    } else {
      // If not connected, return to homepage
      router.push(`/${locale}`);
    }
  };
  return (
    <div>
      <Button
        variant="outline"
        onClick={handleGoBack}
        className="flex items-center gap-2 border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
      >
        <ArrowLeft className="h-4 w-4" />
        {session?.user ? (
          <>
            <LayoutDashboard className="h-4 w-4" />
            {t('backToDashboard')}
          </>
        ) : (
          <>
            <Home className="h-4 w-4" />
            {t('backToHome')}
          </>
        )}
      </Button>
    </div>
  );
}
