"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useApi, usePagination } from "@/hooks";
import { ActivityEvent, ActivityResponse } from "@/components/types/common";
import ActivityLoader from "./RecentActivity/ActivityLoader";
import ActivityError from "./RecentActivity/ActivityError";
import ActivityFilters from "./RecentActivity/ActivityFilters";
import ActivityItem from "./RecentActivity/ActivityItem";
import ActivityPagination from "./RecentActivity/ActivityPagination";
import ActivityEmpty from "./RecentActivity/ActivityEmpty";

export default function RecentActivity() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");

  // Use usePagination hook for pagination logic
  const { currentPage, goToPage } = usePagination();

  // Build API URL with filters and pagination
  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: "10",
    });

    if (typeFilter) params.append("type", typeFilter);
    if (severityFilter) params.append("severity", severityFilter);

    return `/api/admin/activities?${params}`;
  }, [currentPage, typeFilter, severityFilter]);

  // Use useApi hook for fetching activities
  const {
    data: activityData,
    loading,
    error,
    refetch: fetchActivities,
  } = useApi<ActivityResponse>(buildApiUrl(), {
    onError: (error) => {
      // Error handling is managed by the hook
    },
  });
  // Refetch when dependencies change
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities, currentPage, typeFilter, severityFilter]);
  const handlePageChange = (newPage: number) => {
    goToPage(newPage);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === "all" ? "" : value);
    goToPage(1);
  };

  const handleSeverityFilterChange = (value: string) => {
    setSeverityFilter(value === "all" ? "" : value);
    goToPage(1);
  };
  if (loading && !activityData) {
    return <ActivityLoader />;
  }

  if (error) {
    return <ActivityError error={error} />;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Recent Activity
            </span>
          </CardTitle>

          <ActivityFilters
            typeFilter={typeFilter}
            severityFilter={severityFilter}
            onTypeFilterChange={handleTypeFilterChange}
            onSeverityFilterChange={handleSeverityFilterChange}
          />
        </CardHeader>
        <CardContent>
          {!activityData?.activities.length ? (
            <ActivityEmpty />
          ) : (
            <>
              <div className="space-y-4">
                {activityData.activities.map((activity, index) => (
                  <ActivityItem
                    key={activity._id}
                    activity={activity}
                    index={index}
                  />
                ))}
              </div>

              <ActivityPagination
                pagination={activityData.pagination}
                currentPage={currentPage}
                loading={loading}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
