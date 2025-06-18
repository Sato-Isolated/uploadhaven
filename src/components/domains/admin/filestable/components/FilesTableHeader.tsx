import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

interface FilesTableHeaderProps {
  totalFiles: number;
}

export function FilesTableHeader({
  totalFiles,
}: FilesTableHeaderProps) {
  const t = useTranslations('Admin');

  return (
    <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:border-gray-700/50 dark:from-gray-800/50 dark:to-gray-900/50">
      <div className="flex items-center space-x-3">
        <motion.div
          className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-lg"
          whileHover={{ rotate: 5, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Database className="h-6 w-6 text-white" />
        </motion.div>
        <div>
          <CardTitle className="text-xl">{t('allFiles')}</CardTitle>
          <CardDescription className="text-base">
            {t('manageAllFilesDescription', { totalFiles })}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}
