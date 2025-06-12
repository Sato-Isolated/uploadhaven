'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AnalyticsHeaderProps {
  onRefresh: () => void;
  title?: string;
}

export default function AnalyticsHeader({
  onRefresh,
  title = 'Download Analytics',
}: AnalyticsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:via-blue-200 dark:to-indigo-200">
          {title}
        </h3>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Monitor file download trends and performance
        </p>
      </div>
      <Button
        onClick={onRefresh}
        variant="outline"
        className="border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
}
