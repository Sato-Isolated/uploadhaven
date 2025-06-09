"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/utils";
import { Database, HardDrive, Upload, Clock, Activity } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { BaseComponentProps } from "@/components/types/common";

interface UserStatsProps extends BaseComponentProps {
  userId: string;
  session?: any; // Add session prop to check authentication
}

export default function ClientUserStats({ userId, session }: UserStatsProps) {
  // Stabilize the authentication check to prevent unnecessary re-renders
  const isAuthenticated = useMemo(() => Boolean(session?.user), [session?.user]);

  // Use TanStack Query for better performance and caching
  const {
    data: stats,
    isLoading: loading,
    error,
    refetch: fetchStats,
  } = useUserStats(isAuthenticated ? userId : undefined);

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="pb-2">
                <motion.div
                  className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-24"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </CardHeader>
              <CardContent>
                <motion.div
                  className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded w-16"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  }
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <motion.div
                className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Activity className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <p className="text-red-700 dark:text-red-300 font-medium">
                  Unable to load statistics
                </p>                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error?.message || "An unexpected error occurred"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  if (!stats) {
    return null;
  }
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Total Files",
            value: stats.totalFiles.toLocaleString(),
            icon: Database,
            gradient: "from-blue-500 to-cyan-500",
            bgGradient:
              "from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950",
          },
          {
            title: "Total Size",
            value: formatFileSize(stats.totalSize),
            icon: HardDrive,
            gradient: "from-purple-500 to-indigo-500",
            bgGradient:
              "from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950",
          },
          {
            title: "Recent Uploads",
            value: stats.recentUploads,
            subtitle: "Last 7 days",
            icon: Upload,
            gradient: "from-green-500 to-emerald-500",
            bgGradient:
              "from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950",
          },
          {
            title: "Expiring Soon",
            value: stats.expiringSoon,
            subtitle: "Next 24 hours",
            icon: Clock,
            gradient: "from-orange-500 to-red-500",
            bgGradient:
              "from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950",
          },
        ].map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <Card
                className={`border-0 shadow-lg bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {stat.title}
                    </CardTitle>
                    <motion.div
                      className={`p-2 bg-gradient-to-br ${stat.gradient} rounded-lg shadow-md`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <IconComponent className="h-4 w-4 text-white" />
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <motion.div
                    className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: 0.2 + index * 0.1,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    {stat.value}
                  </motion.div>
                  {stat.subtitle && (
                    <motion.p
                      className="text-xs text-gray-600 dark:text-gray-400 mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                    >
                      {stat.subtitle}
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
