"use client";

import { motion } from "motion/react";
import {
  AnalyticsLoader,
  AnalyticsError,
  AnalyticsEmpty,
  AnalyticsHeader,
  AnalyticsOverview,
  TopFilesSection,
  TrendsChart,
  calculateTrend,
} from "@/components/domains/analytics/download";
import { useUserAnalytics } from "@/hooks";
import { BaseComponentProps } from "@/types";

type UserAnalyticsProps = BaseComponentProps;

export default function UserAnalytics({ className = "" }: UserAnalyticsProps) {
  // Use TanStack Query for better performance and caching
  const {
    data: analytics,
    isLoading,
    error,
    refetch: fetchAnalytics,
  } = useUserAnalytics();

  if (isLoading) {
    return <AnalyticsLoader className={className} />;
  }
  if (error) {
    return (
      <AnalyticsError
        error={error?.message || "An unexpected error occurred"}
        onRetry={fetchAnalytics}
        className={className}
      />
    );
  }
  if (!analytics) {
    return <AnalyticsEmpty className={className} />;
  }

  // Calculate trend data for overview
  const trendData = calculateTrend(analytics);

  return (
    <motion.div
      className={`space-y-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnalyticsHeader onRefresh={fetchAnalytics} title="My Analytics" />
      <AnalyticsOverview analytics={analytics} trend={trendData} />
      <TopFilesSection analytics={analytics} onRefresh={fetchAnalytics} />
      <TrendsChart analytics={analytics} />
    </motion.div>
  );
}
