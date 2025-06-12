'use client';

import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface AnalyticsLoaderProps {
  className?: string;
}

export default function AnalyticsLoader({
  className = '',
}: AnalyticsLoaderProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex h-48 items-center justify-center">
        <RefreshCw className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    </Card>
  );
}
