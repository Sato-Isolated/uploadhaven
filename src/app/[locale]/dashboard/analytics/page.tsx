import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import UserAnalytics from '@/components/domains/analytics/user';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function UserAnalyticsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/auth/signin');
  }

  const t = await getTranslations('Analytics');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('description')}
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4" />
              {t('backToDashboard')}
            </Button>
          </Link>
        </div>

        {/* Analytics Component */}
        <UserAnalytics />
      </div>
    </div>
  );
}
