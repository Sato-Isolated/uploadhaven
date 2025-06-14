import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database } from 'lucide-react';

interface FilesTableHeaderProps {
  totalFiles: number;
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}

export function FilesTableHeader({
  totalFiles,
  isAllSelected,
  onSelectAll,
}: FilesTableHeaderProps) {
  const t = useTranslations('Admin');
  
  return (
    <>
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

      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onSelectAll(e.target.checked);
              }}
              checked={isAllSelected}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </th>
          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
            {t('file')}
          </th>
          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
            {t('size')}
          </th>
          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
            {t('type')}
          </th>
          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
            {t('owner')}
          </th>
          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
            {t('uploadDate')}
          </th>
          <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">
            {t('downloads')}
          </th>
          <th className="p-4 text-right font-semibold text-gray-700 dark:text-gray-300">
            {t('actions')}
          </th>
        </tr>
      </thead>
    </>
  );
}
