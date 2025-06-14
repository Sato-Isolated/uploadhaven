'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useStatsQuery } from '@/hooks';
import { useTranslations } from 'next-intl';

// Component imports
import StatsHeader from './components/StatsHeader';
import StatsLoadingIndicator from './components/StatsLoadingIndicator';
import StatsErrorState from './components/StatsErrorState';
import StatsGrid from './components/StatsGrid';
import SystemStatus from './components/SystemStatus';
import ManagementActions from './components/ManagementActions';
import SystemInformation from './components/SystemInformation';

export default function StatsPanel() {
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const t = useTranslations('Stats');
  const tCommon = useTranslations('Common');

  // Use TanStack Query for better performance and caching
  const {
    data: stats,
    isLoading: loading,
    refetch: fetchStats,
  } = useStatsQuery();

  const runCleanup = async () => {
    try {
      const response = await fetch('/api/cleanup', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast.success(t('cleanupCompleted', { deletedCount: data.deletedCount }));
        await fetchStats(); // Refresh stats
      } else {
        toast.error(t('cleanupFailed'));
      }
    } catch {
      toast.error(t('errorRunningCleanup'));
    }
  };

  const bulkDeleteAll = async () => {
    if (
      !confirm(
        t('bulkDeleteConfirmation')
      )
    ) {
      return;
    }

    try {
      setBulkDeleting(true);
      const response = await fetch('/api/bulk-delete', { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        toast.success(
          t('bulkDeleteCompleted', { deletedCount: data.deletedCount, totalFiles: data.totalFiles })
        );
        localStorage.removeItem('uploadedFiles');
        await fetchStats(); // Refresh stats
      } else {
        toast.error(t('bulkDeleteFailed'));
      }
    } catch {
      toast.error(t('errorPerformingBulkDelete'));
    } finally {
      setBulkDeleting(false);
    }
  };
  if (loading) {
    return <StatsLoadingIndicator />;
  }

  if (!stats) {
    return <StatsErrorState />;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-lg dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        <StatsHeader onRefresh={fetchStats} />
        <CardContent className="space-y-6">
          <StatsGrid stats={stats} />
          <Separator />
          <SystemStatus stats={stats} />
          <Separator />
          <ManagementActions
            stats={stats}
            bulkDeleting={bulkDeleting}
            onRunCleanup={runCleanup}
            onBulkDeleteAll={bulkDeleteAll}
          />
        </CardContent>
      </Card>

      <SystemInformation stats={stats} />
    </motion.div>
  );
}
