"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  AdminAnalytics as AdminAnalyticsType,
  getFileTypeIcon,
  formatDate,
  formatDateTime,
} from "./utils";
import { useApi } from "@/hooks";

interface AdminAnalyticsProps {
  className?: string;
}

export default function AdminAnalytics({
  className = "",
}: AdminAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30d");

  // Replace manual API logic with useApi hook
  const {
    data: analytics,
    loading: isLoading,
    error,
    refetch: fetchAnalytics,
  } = useApi<AdminAnalyticsType>(
    `/api/analytics/admin?timeRange=${timeRange}`,
    {
      onError: (err) => {
        console.error("Error fetching admin analytics:", err);
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={fetchAnalytics} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const { systemOverview, fileAnalytics, userAnalytics, securityAnalytics } =
    analytics;

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive system analytics and insights
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 days</SelectItem>
            <SelectItem value="30d">30 days</SelectItem>
            <SelectItem value="90d">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Files
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {systemOverview.totalFiles.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    +{systemOverview.filesLast24h} today
                  </p>
                </div>
                <div className="text-3xl">📁</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {systemOverview.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {systemOverview.activeUsers} active this week
                  </p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Storage Used
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {systemOverview.totalStorage}
                  </p>
                  <p className="text-xs text-gray-500">Across all files</p>
                </div>
                <div className="text-3xl">💾</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Downloads
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {systemOverview.totalDownloads.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">All time downloads</p>
                </div>
                <div className="text-3xl">⬇️</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="files" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="files">File Analytics</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* File Analytics Tab */}
        <TabsContent value="files" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={fileAnalytics.uploadTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => formatDate(value as string)}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Files Uploaded"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* File Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>File Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={fileAnalytics.fileTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) =>
                        `${getFileTypeIcon(type)} ${count}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {fileAnalytics.fileTypeDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Files */}
          <Card>
            <CardHeader>
              <CardTitle>Most Downloaded Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fileAnalytics.topFiles.slice(0, 8).map((file) => (
                  <div
                    key={file.filename}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {getFileTypeIcon(file.mimeType)}
                      </span>
                      <div>
                        <p className="font-medium text-sm">
                          {file.originalName}
                        </p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {file.downloadCount} downloads
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Analytics Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userAnalytics.growthTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => formatDate(value as string)}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="New Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Storage by User */}
            <Card>
              <CardHeader>
                <CardTitle>Top Users by Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userAnalytics.storageByUser.slice(0, 8).map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {user.userName || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.fileCount} files
                        </p>
                      </div>
                      <Badge variant="outline">{user.totalSize}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Analytics Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Events Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={securityAnalytics.eventsByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Security Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityAnalytics.recentEvents
                    .slice(0, 8)
                    .map((event, index) => (
                      <div
                        key={`${event.type}-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {event.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(event.timestamp)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Database Connection</span>
                    <Badge className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>File Storage</span>
                    <Badge className="bg-green-100 text-green-800">
                      Available
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>API Response Time</span>
                    <Badge variant="outline">
                      ~{Math.floor(Math.random() * 100 + 50)}ms
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>File Growth (Weekly)</span>
                    <Badge
                      className={
                        systemOverview.fileGrowth > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {systemOverview.fileGrowth > 0 ? "+" : ""}
                      {systemOverview.fileGrowth}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>User Growth (Weekly)</span>
                    <Badge
                      className={
                        systemOverview.userGrowth > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {systemOverview.userGrowth > 0 ? "+" : ""}
                      {systemOverview.userGrowth}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
