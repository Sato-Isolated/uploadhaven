'use client';

import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import type { EmptyUsersStateProps } from './types';

export default function EmptyUsersState({ searchTerm }: EmptyUsersStateProps) {
  const t = useTranslations('Admin');

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {searchTerm ? t('noUsersFound') : t('noUsers')}
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        {searchTerm ? t('tryDifferentSearch') : t('noUsersDescription')}
      </p>
    </div>
  );
}
