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
      // Si l'utilisateur est connecté, retourner au dashboard
      router.push(`/${locale}/dashboard`);
    } else {
      // Si non connecté, retourner à la homepage
      router.push(`/${locale}`);
    }
  };

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={handleGoBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
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
