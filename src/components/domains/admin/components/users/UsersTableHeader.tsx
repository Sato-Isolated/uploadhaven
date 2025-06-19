'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import type { UsersTableHeaderProps } from './types';

export default function UsersTableHeader({
  searchTerm,
  onSearchChange,
  filteredCount,
  totalCount,
  onRefresh
}: UsersTableHeaderProps) {
  const t = useTranslations('Admin');

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
          <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          {t('usersManagement')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {t('usersCount', { count: filteredCount, total: totalCount })}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder={t('searchUsers')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>
        
        {onRefresh && (
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm" 
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('refresh')}
          </Button>
        )}
      </div>
    </div>
  );
}
