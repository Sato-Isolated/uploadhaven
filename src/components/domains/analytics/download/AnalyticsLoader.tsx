"use client";

import { Card } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface AnalyticsLoaderProps {
  className?: string;
}

export default function AnalyticsLoader({
  className = "",
}: AnalyticsLoaderProps) {
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </Card>
  );
}
