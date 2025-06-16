import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';

interface FilesTableOwnerCellProps {
  isAnonymous: boolean;
  userName?: string;
}

export function FilesTableOwnerCell({
  isAnonymous,
  userName,
}: FilesTableOwnerCellProps) {
  const t = useTranslations('Admin');

  if (isAnonymous) {
    return (
      <Badge
        variant="secondary"
        className="bg-gradient-to-r from-gray-100 to-gray-200 text-xs font-semibold dark:from-gray-800 dark:to-gray-700"
      >
        {t('anonymous')}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-1.5 dark:from-green-900 dark:to-emerald-900"
        whileHover={{ scale: 1.1 }}
      >
        <User className="h-3 w-3 text-green-600 dark:text-green-400" />
      </motion.div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {userName || t('unknown')}
      </span>
    </div>
  );
}
