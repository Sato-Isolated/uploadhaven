'use client';

import { Card, CardContent } from '@/components/ui/card';

export function AnalyticsEmptyState() {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-gray-500">No analytics data available</p>
      </CardContent>
    </Card>
  );
}
