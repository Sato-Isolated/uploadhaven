'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StatsErrorState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-destructive text-sm">
          Failed to load statistics
        </div>
      </CardContent>
    </Card>
  );
}
