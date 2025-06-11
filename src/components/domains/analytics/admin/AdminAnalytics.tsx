"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAnalytics } from "@/components/domains/admin/analytics/hooks";
import {
  getFileTypeIcon,
  formatDate,
  formatDateTime,
} from "@/components/domains/admin/analytics/utils";
import {
  AnalyticsHeader,
  SystemOverviewCards,
  FileAnalyticsTab,
  UserAnalyticsTab,
  SecurityAnalyticsTab,
  PerformanceTab,
  AnalyticsLoadingState,
  AnalyticsErrorState,
  AnalyticsEmptyState,
} from "./components";

interface AdminAnalyticsProps {
  className?: string;
}

export default function AdminAnalytics({
  className = "",
}: AdminAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30d");

  // Use TanStack Query for better performance and caching
  const {
    data: analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  } = useAdminAnalytics(timeRange);

  // Loading state
  if (isLoading) {
    return <AnalyticsLoadingState />;
  }

  // Error state
  if (error) {
    return <AnalyticsErrorState error={error} onRetry={fetchAnalytics} />;
  }

  // Empty state
  if (!analytics) {
    return <AnalyticsEmptyState />;
  }
  const { systemOverview, fileAnalytics, userAnalytics, securityAnalytics } =
    analytics;

  // Transform security analytics to match component expectations
  const transformedSecurityAnalytics = {
    ...securityAnalytics,
    recentEvents: securityAnalytics.recentEvents.map((event) => ({
      type: event.type,
      timestamp: formatDateTime(event.timestamp),
    })),
  };

  // Colors for charts
  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Time Range Selector */}
      <AnalyticsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />

      {/* System Overview Cards */}
      <SystemOverviewCards systemOverview={systemOverview} />

      {/* Analytics Tabs */}
      <Tabs defaultValue="files" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="files">File Analytics</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        {/* File Analytics Tab */}
        <TabsContent value="files">
          <FileAnalyticsTab
            fileAnalytics={fileAnalytics}
            formatDate={formatDate}
            getFileTypeIcon={getFileTypeIcon}
            colors={COLORS}
          />
        </TabsContent>
        {/* User Analytics Tab */}
        <TabsContent value="users">
          <UserAnalyticsTab
            userAnalytics={userAnalytics}
            formatDate={formatDate}
          />
        </TabsContent>{" "}
        {/* Security Analytics Tab */}
        <TabsContent value="security">
          <SecurityAnalyticsTab
            securityAnalytics={transformedSecurityAnalytics}
            formatDateTime={(date: string) => date}
          />
        </TabsContent>
        {/* Performance Tab */}
        <TabsContent value="performance">
          <PerformanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
