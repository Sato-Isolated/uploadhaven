'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  RefreshCw,
  Shield,
  Activity
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

export default function QuickActions() {
  const t = useTranslations('Admin');
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const handleAction = async (actionKey: string, action: () => Promise<void>) => {
    setIsLoading(prev => ({ ...prev, [actionKey]: true }));
    try {
      await action();
      toast.success(t('actionCompleted'));
    } catch (error) {
      toast.error(t('actionFailed'));
      console.error('Action failed:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // Zero Knowledge Compliant Actions Only
  const cleanupExpiredFiles = async () => {
    const response = await fetch('/api/admin/cleanup/expired', { method: 'POST' });    if (!response.ok) throw new Error('Cleanup failed');
  };  const refreshStats = async () => {
    const response = await fetch('/api/admin/stats/refresh', { method: 'POST' });
    if (!response.ok) throw new Error('Stats refresh failed');
  };

  // Zero Knowledge Compliant Actions Only - Essential maintenance actions
  const actions = [
    {
      key: 'cleanup',
      title: t('cleanupExpiredFiles'),
      description: t('removeExpiredFilesDesc'),
      icon: Trash2,
      action: cleanupExpiredFiles,
      variant: 'outline' as const,
    },
    {
      key: 'refresh',
      title: t('refreshStats'),
      description: t('refreshStatsDesc'),
      icon: RefreshCw,
      action: refreshStats,
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="bg-white/70 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 shadow-sm dark:shadow-gray-900/30 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-700/20">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-50">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {t('quickActions')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">        <div className="grid gap-4 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const loading = isLoading[action.key];
            
            return (
              <Button
                key={action.key}
                variant={action.variant}
                onClick={() => handleAction(action.key, action.action)}
                disabled={loading}
                className="h-auto flex-col items-start justify-start p-4 text-left border-gray-300/60 dark:border-gray-600/60 text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/60 transition-all duration-200"
              >
                <div className="mb-2 flex w-full items-center gap-2">
                  <Icon className={`h-4 w-4 ${loading ? 'animate-spin' : ''} text-blue-600 dark:text-blue-400`} />
                  <span className="font-medium text-gray-900 dark:text-gray-50">{action.title}</span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
        
        {/* Zero Knowledge Notice */}
        <div className="mt-6 rounded-lg border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/20 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">
                {t('zeroKnowledgeActions')}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('zeroKnowledgeActionsDesc')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
