"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle } from "lucide-react";
import { BaseComponentProps } from "@/types";

interface ActivityErrorProps extends BaseComponentProps {
  error: string;
}

export default function ActivityError({ error }: ActivityErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
            <span className="bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
              Recent Activity
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500 opacity-50" />
            <p className="text-lg font-medium text-red-600 dark:text-red-400">
              Error loading activities
            </p>
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
