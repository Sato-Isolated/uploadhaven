'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AnalyticsErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export function AnalyticsErrorState({
  error,
  onRetry,
}: AnalyticsErrorStateProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <p className="text-red-600">Error: {error.message}</p>
        <Button onClick={onRetry} className="mt-4" variant="outline">
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
