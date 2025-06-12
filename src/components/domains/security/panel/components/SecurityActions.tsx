'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Trash2 } from 'lucide-react';
import { SecurityActionsProps } from '../types';

export default function SecurityActions({
  onRefresh,
  onExport,
  onClear,
  isLoading,
}: SecurityActionsProps) {
  return (
    <div className="mb-6 flex gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onClear}
        disabled={isLoading}
        className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" />
        Clear Logs
      </Button>
    </div>
  );
}
