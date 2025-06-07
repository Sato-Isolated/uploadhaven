"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import ActivityLoader from "./RecentActivity/ActivityLoader";
import ActivityError from "./RecentActivity/ActivityError";
import ActivityFilters from "./RecentActivity/ActivityFilters";
import ActivityItem from "./RecentActivity/ActivityItem";
import ActivityPagination from "./RecentActivity/ActivityPagination";
import ActivityEmpty from "./RecentActivity/ActivityEmpty";

interface ActivityEvent {
  _id: string;
  type: string;
  timestamp: string;
  ip: string;
  details: string;
  severity: "low" | "medium" | "high";
  userAgent?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
}

interface ActivityData {
  activities: ActivityEvent[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function RecentActivity() {
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const fetchActivities = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
        });

        if (typeFilter) params.append("type", typeFilter);
        if (severityFilter) params.append("severity", severityFilter);

        const response = await fetch(`/api/admin/activities?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }

        const data = await response.json();
        setActivityData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [typeFilter, severityFilter]
  );
  useEffect(() => {
    fetchActivities(currentPage);
  }, [currentPage, fetchActivities]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  const handleSeverityFilterChange = (value: string) => {
    setSeverityFilter(value === "all" ? "" : value);
    setCurrentPage(1);
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
