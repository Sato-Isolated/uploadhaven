import { motion } from 'motion/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function SignInFormFooter() {
  const t = useTranslations('Auth');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="space-y-4"
    >
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            {t('newToUploadHaven')}
          </span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/auth/signup"
          className="group inline-flex items-center gap-2 font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <Sparkles className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
          {t('createAccount')}
        </Link>
      </div>

      <div className="pt-2 text-center">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-medium text-gray-600 transition-colors duration-200 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          {t('backToUpload')}
        </Link>
      </div>
    </motion.div>
  );
}
