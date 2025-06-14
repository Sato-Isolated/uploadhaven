import { motion } from 'motion/react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SignInFormHeader() {
  const t = useTranslations('Auth');

  return (
    <CardHeader className="relative z-10 space-y-4 pb-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
      >
        <Upload className="h-8 w-8 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <CardTitle className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-gray-300">
          {t('welcomeBack')}
        </CardTitle>
        <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
          {t('signInToAccess')}
        </CardDescription>
      </motion.div>
    </CardHeader>
  );
}
