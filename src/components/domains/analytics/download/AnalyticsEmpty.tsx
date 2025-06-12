'use client';

import { Card } from '@/components/ui/card';

interface AnalyticsEmptyProps {
  className?: string;
}

export default function AnalyticsEmpty({
  className = '',
}: AnalyticsEmptyProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="text-muted-foreground text-center">
        No analytics data available
      </div>
    </Card>
  );
}
