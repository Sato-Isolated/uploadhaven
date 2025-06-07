"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AnalyticsErrorProps {
  error: string;
  onRetry: () => void;
  className?: string;
}

export default function AnalyticsError({
  error,
  onRetry,
  className = "",
}: AnalyticsErrorProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="text-center space-y-4">
        <div className="text-red-500">Error loading analytics</div>
        <div className="text-sm text-muted-foreground">{error}</div>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </Card>
  );
}
