"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { generateUuid } from "@/lib/utils";
import { SystemStatusProps } from "../types";

export default function SystemStatus({ stats }: SystemStatusProps) {
  const statusBadges = [
    {
      condition: stats.totalFiles > 0,
      variant: stats.totalFiles > 0 ? "default" : "secondary",
      text: stats.totalFiles > 0 ? "Files Available" : "No Files",
    },
    {
      condition: stats.last24hUploads > 0,
      variant: stats.last24hUploads > 0 ? "default" : "secondary",
      text:
        stats.last24hUploads > 0
          ? `${stats.last24hUploads} Recent Uploads`
          : "No Recent Activity",
    },
    {
      condition: true,
      variant: "outline",
      text:
        stats.totalSizeBytes > 50 * 1024 * 1024 ? "High Usage" : "Normal Usage",
    },
    {
      condition: true,
      variant: stats.last7dUploads > 10 ? "destructive" : "default",
      text: `${stats.last7dUploads} uploads this week`,
    },
  ];

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.4, duration: 0.5 }}
    >
      <h3 className="text-lg font-medium">System Status</h3>      <div className="flex flex-wrap gap-2">
        {statusBadges.map((badge, index) => (
          <motion.div
            key={generateUuid()}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6 + index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
          >
            <Badge
              variant={
                badge.variant as
                  | "default"
                  | "secondary"
                  | "outline"
                  | "destructive"
                  | null
                  | undefined
              }
            >
              {badge.text}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
