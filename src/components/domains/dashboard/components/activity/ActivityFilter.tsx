// ActivityFilter.tsx - Filtre des activités
// Responsibility: Permettre le filtrage des activités par type

'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Share, 
  Trash2, 
  Eye, 
  Filter
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { BaseComponentProps } from '@/types';

interface ActivityFilterProps extends BaseComponentProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  activitiesCount: number;
}

const filterOptions = [
  { value: 'all', icon: Filter, label: 'all' },
  { value: 'upload', icon: Upload, label: 'uploads' },
  { value: 'download', icon: Download, label: 'downloads' },
  { value: 'share', icon: Share, label: 'shares' },
  { value: 'view', icon: Eye, label: 'views' },
  { value: 'delete', icon: Trash2, label: 'deletions' },
];

export function ActivityFilter({
  selectedFilter,
  onFilterChange,
  activitiesCount,
  className = '',
}: ActivityFilterProps) {
  const t = useTranslations('Dashboard');

  const getFilterColor = (filterValue: string) => {
    switch (filterValue) {
      case 'upload':
        return 'hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300';
      case 'download':
        return 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300';
      case 'share':
        return 'hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20 dark:hover:text-purple-300';
      case 'delete':
        return 'hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-300';
      case 'view':
        return 'hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-900/20 dark:hover:text-gray-300';
      default:
        return 'hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-900/20 dark:hover:text-gray-300';
    }
  };

  const getSelectedColor = (filterValue: string) => {
    switch (filterValue) {
      case 'upload':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'download':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'share':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      case 'view':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-800/30 p-4 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t('filterActivities')}
        </h4>
        <Badge variant="outline" className="text-xs">
          {activitiesCount} {t('activities')}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedFilter === option.value;
          
          return (
            <motion.div
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={isSelected ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onFilterChange(option.value)}
                className={`
                  flex items-center gap-2 text-xs transition-all duration-200
                  ${isSelected 
                    ? getSelectedColor(option.value)
                    : `text-gray-600 dark:text-gray-400 ${getFilterColor(option.value)}`
                  }
                `}
              >
                <IconComponent className="h-3 w-3" />
                {t(option.label)}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200/60 dark:border-gray-700/60 pt-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('todayActivities')}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {/* This would be calculated from actual data */}
            {Math.floor(activitiesCount * 0.3)}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('thisWeek')}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {activitiesCount}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default ActivityFilter;
