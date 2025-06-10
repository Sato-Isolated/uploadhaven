"use client";

import { motion } from "motion/react";
import { Activity, Wifi, WifiOff } from "lucide-react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import ActivityFilters from "../recent/ActivityFilters";

interface ActivityHeaderProps {
  realtimeConnected: boolean;
  activityCount: number;
  typeFilter: string;
  severityFilter: string;
  onTypeFilterChange: (value: string) => void;
  onSeverityFilterChange: (value: string) => void;
}

export default function ActivityHeader({
  realtimeConnected,
  activityCount,
  typeFilter,
  severityFilter,
  onTypeFilterChange,
  onSeverityFilterChange
}: ActivityHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Recent Activity
        </span>
        
        {/* Real-time connection indicator */}
        <div className="flex items-center gap-2 ml-auto">
          {activityCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-red-500 text-white text-xs px-2 py-1 rounded-full"
            >
              {activityCount} new
            </motion.div>
          )}
          <motion.div
            className="flex items-center gap-1 text-xs"
            animate={{ opacity: realtimeConnected ? 1 : 0.5 }}
          >
            {realtimeConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-gray-400" />
                <span className="text-gray-500">Offline</span>
              </>
            )}
          </motion.div>
        </div>
      </CardTitle>

      <ActivityFilters
        typeFilter={typeFilter}
        severityFilter={severityFilter}
        onTypeFilterChange={onTypeFilterChange}
        onSeverityFilterChange={onSeverityFilterChange}
      />
    </CardHeader>
  );
}
