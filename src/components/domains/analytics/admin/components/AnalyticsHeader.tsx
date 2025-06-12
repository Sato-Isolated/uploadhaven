'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
  title?: string;
  description?: string;
}

export function AnalyticsHeader({
  timeRange,
  onTimeRangeChange,
  title = 'Admin Analytics',
  description = 'Comprehensive system analytics and insights',
}: AnalyticsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <Select value={timeRange} onValueChange={onTimeRangeChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">7 days</SelectItem>
          <SelectItem value="30d">30 days</SelectItem>
          <SelectItem value="90d">90 days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
