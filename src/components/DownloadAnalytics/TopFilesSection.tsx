"use client";

import { motion } from "motion/react";
import { Eye, RefreshCw, FileText, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DownloadAnalytics, getFileTypeIcon } from "./utils";

interface TopFilesSectionProps {
  analytics: DownloadAnalytics;
  onRefresh: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function TopFilesSection({
  analytics,
  onRefresh,
}: TopFilesSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Most Downloaded Files
          </h3>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {analytics.topFiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No download data available</p>
            <p className="text-sm mt-1">
              Files will appear here once they are downloaded
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {analytics.topFiles.map((file, index) => (
              <motion.div
                key={file.filename}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-2xl">{getFileTypeIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        #{index + 1}
                      </Badge>
                      <p className="font-medium truncate text-gray-900 dark:text-gray-100">
                        {file.originalName}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatFileSize(file.size)} • Uploaded
                      {new Date(file.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {file.downloadCount}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    downloads
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
