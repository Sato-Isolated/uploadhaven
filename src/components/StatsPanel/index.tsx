"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Stats } from "./types";
import { useApi, usePolling } from "@/hooks";

// Component imports
import StatsHeader from "./components/StatsHeader";
import StatsLoadingIndicator from "./components/StatsLoadingIndicator";
import StatsErrorState from "./components/StatsErrorState";
import StatsGrid from "./components/StatsGrid";
import SystemStatus from "./components/SystemStatus";
import ManagementActions from "./components/ManagementActions";
import SystemInformation from "./components/SystemInformation";

export default function StatsPanel() {
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Replace manual fetch logic with useApi hook
  const {
    data: statsResponse,
    loading,
    error,
    refetch: fetchStats,
  } = useApi<{ success: boolean; stats: Stats }>("/api/stats", {
    onSuccess: (data) => {
      if (!data.success) {
        toast.error("Failed to load statistics");
      }
    },
    onError: (error) => {
      toast.error("Error loading statistics");
    },
  });

  // Auto-refresh stats every 30 seconds using usePolling hook
  usePolling(fetchStats, { interval: 30000 });

  // Extract stats from response
  const stats = statsResponse?.stats;

  const runCleanup = async () => {
    try {
      const response = await fetch("/api/cleanup", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        toast.success(`Cleanup completed: ${data.deletedCount} files removed`);
        await fetchStats(); // Refresh stats
      } else {
        toast.error("Cleanup failed");
      }
    } catch {
      toast.error("Error running cleanup");
    }
  };

  const bulkDeleteAll = async () => {
    if (
      !confirm(
        "Are you sure you want to delete ALL uploaded files? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setBulkDeleting(true);
      const response = await fetch("/api/bulk-delete", { method: "DELETE" });
      const data = await response.json();

      if (data.success) {
        toast.success(
          `Bulk delete completed: ${data.deletedCount}/${data.totalFiles} files removed`
        );
        localStorage.removeItem("uploadedFiles");
        await fetchStats(); // Refresh stats
      } else {
        toast.error("Bulk delete failed");
      }
    } catch {
      toast.error("Error performing bulk delete");
    } finally {
      setBulkDeleting(false);
    }
  };
  if (loading) {
    return <StatsLoadingIndicator />;
  }

  if (!stats) {
    return <StatsErrorState />;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        <StatsHeader onRefresh={fetchStats} />
        <CardContent className="space-y-6">
          <StatsGrid stats={stats} />
          <Separator />
          <SystemStatus stats={stats} />
          <Separator />
          <ManagementActions
            stats={stats}
            bulkDeleting={bulkDeleting}
            onRunCleanup={runCleanup}
            onBulkDeleteAll={bulkDeleteAll}
          />
        </CardContent>
      </Card>

      <SystemInformation stats={stats} />
    </motion.div>
  );
}
