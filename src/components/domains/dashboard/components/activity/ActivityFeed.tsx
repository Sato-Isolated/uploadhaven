// ActivityFeed.tsx - Flux d'activités utilisateur
// Responsibility: Afficher et gérer la liste des activités récentes

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useActivitiesQuery } from '@/hooks';
import { ActivityItem } from './ActivityItem';
import { ActivityFilter } from './ActivityFilter';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Activity, RefreshCw, Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { BaseComponentProps } from '@/types';

interface ActivityFeedProps extends BaseComponentProps {
  userId?: string;
  limit?: number;
  showFilter?: boolean;
  compact?: boolean;
}

export function ActivityFeed({
  userId,
  limit = 10,
  showFilter = true,
  compact = false,
  className = '',
}: ActivityFeedProps) {
  const t = useTranslations('Dashboard');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch activities
  const {
    data: activitiesResponse,
    isLoading,
    error,
    refetch,
  } = useActivitiesQuery({
    userId,
    limit,
    type: selectedFilter === 'all' ? undefined : selectedFilter,
  });

  const activities = activitiesResponse?.activities || [];

  // Filter activities based on selected filter
  const filteredActivities = useMemo(() => {
    if (selectedFilter === 'all') return activities;
    return activities.filter((activity) => activity.type === selectedFilter);
  }, [activities, selectedFilter]);

  const handleRefresh = () => {
    refetch();
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner 
            variant="dots" 
            message={t('loadingActivities')}
            className="py-8"
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Activity}
            title={t('errorLoadingActivities')}
            description={t('errorLoadingActivitiesDesc')}
            actionLabel={t('tryAgain')}
            onAction={handleRefresh}
            variant="subtle"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="border-0 bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30 dark:from-gray-800/50 dark:via-gray-800/30 dark:to-blue-900/20 shadow-lg backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-800/30 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {t('recentActivity')}
              {activities.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activities.length}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {showFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {!compact && t('filter')}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {!compact && t('refresh')}
              </Button>
            </div>
          </div>

          {/* Filter Component */}
          {showFilter && isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <ActivityFilter
                selectedFilter={selectedFilter}
                onFilterChange={handleFilterChange}
                activitiesCount={activities.length}
              />
            </motion.div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {filteredActivities.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Activity}
                title={t('noActivities')}
                description={t('noActivitiesDesc')}
                variant="subtle"
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-200/60 dark:divide-gray-700/60">
              {filteredActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <ActivityItem
                    activity={activity}
                    compact={compact}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ActivityFeed;
