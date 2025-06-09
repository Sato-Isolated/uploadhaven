"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  AnalyticsLoader,
  AnalyticsError,
  AnalyticsEmpty,
  AnalyticsHeader,
  AnalyticsOverview,
  TopFilesSection,
  TrendsChart,
  DownloadAnalytics as DownloadAnalyticsType,
  calculateTrend,
} from "./DownloadAnalytics/";
import { useApi } from "@/hooks";
import { BaseComponentProps, UserStats } from "@/components/types/common";

interface UserAnalyticsProps extends BaseComponentProps {}

export default function UserAnalytics({ className = "" }: UserAnalyticsProps) {
  // Replace manual API logic with useApi hook
  const {
    data: apiResponse,
    loading: isLoading,
    error,
    refetch: fetchAnalytics,
  } = useApi<{ analytics: DownloadAnalyticsType }>("/api/analytics/user", {
    onError: (err) => {
      console.error("Error fetching user analytics:", err);
    },
  });

  // Extract analytics from response
  const analytics = apiResponse?.analytics;

  if (isLoading) {
    return <AnalyticsLoader className={className} />;
  }

  if (error) {
    return (
      <AnalyticsError
        error={error}
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
