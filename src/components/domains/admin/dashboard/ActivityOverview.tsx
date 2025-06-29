'use client';

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import RecentActivity from '@/components/domains/activity/recent';
import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityEvent } from '@/types';
import { getActivityColor, formatActivityType } from './utils';
import { useTranslations } from 'next-intl';

interface ActivityOverviewProps {
  activities: ActivityEvent[];
  loading: boolean;
}

export default function ActivityOverview({
  activities,
  loading,
}: ActivityOverviewProps) {
  const t = useTranslations('Activity');
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {t('recentActivity')}
          </CardTitle>
          <CardDescription>{t('latestSystemActivity')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground text-sm">
                  {t('loadingActivities')}
                </div>
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity._id}
                  className="bg-muted/50 flex items-center gap-3 rounded-lg p-3"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${getActivityColor(
                      activity.type
                    )}`}
                  ></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {formatActivityType(activity.type)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground text-sm">
                  {t('noRecentActivities')}
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 border-t pt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {t('viewAllActivity')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] !max-w-6xl overflow-hidden">
                <DialogHeader>
                  <DialogTitle>{t('recentActivity')}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[75vh] overflow-y-auto pr-2">
                  <RecentActivity enableInfiniteScroll={true} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
