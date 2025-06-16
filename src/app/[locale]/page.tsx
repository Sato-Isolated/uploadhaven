import FileUploader from '@/components/domains/upload/fileuploader';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '@/components/domains/language/LanguageSwitcher';

interface HomeProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  const t = await getTranslations('Home');
  const tNav = await getTranslations('Navigation');

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 py-8 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-800">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Navigation */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
                {t('title')}
              </h1>
              <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            {session ? (
              <>
                <span className="text-muted-foreground text-sm">
                  {t('welcomeUser', {
                    name: session.user.name || session.user.email,
                  })}
                </span>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {tNav('dashboard')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {tNav('signIn')}
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    {tNav('signUp')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h2 className="text-foreground mb-4 text-2xl font-semibold">
            {t('heroTitle')}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg leading-relaxed">
            {t('heroDescription')}
          </p>
        </div>

        {/* File Uploader */}
        <div className="mt-8">
          <FileUploader />
        </div>
      </div>
    </div>
  );
}
