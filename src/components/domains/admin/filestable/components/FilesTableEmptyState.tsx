import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';

export function FilesTableEmptyState() {
  const t = useTranslations('Admin');
  
  return (
    <motion.div
      className="py-16 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <motion.div
        className="relative mx-auto mb-6 h-20 w-20"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 p-6 shadow-lg dark:from-gray-800 dark:to-gray-900">
          <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
      </motion.div>
      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        {t('noFilesFound')}
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        {t('noFilesMatchCriteria')}
      </p>
    </motion.div>
  );
}
