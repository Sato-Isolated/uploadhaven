"use client";

import { useState, useEffect } from "react";
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
  calculateTrend
} from "./DownloadAnalytics/";

interface UserAnalyticsProps {
  className?: string;
}

export default function UserAnalytics({
  className = "",
}: UserAnalyticsProps) {
  const [analytics, setAnalytics] = useState<DownloadAnalyticsType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/analytics/user");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch analytics");
      }

      setAnalytics(data.analytics);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
