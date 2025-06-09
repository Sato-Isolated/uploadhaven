"use client";

import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RecentActivity from "@/components/RecentActivity";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityEvent } from "@/components/types/common";
import { getActivityColor, formatActivityType } from "./utils";

interface ActivityOverviewProps {
  activities: ActivityEvent[];
  loading: boolean;
}

export default function ActivityOverview({
  activities,
  loading,
}: ActivityOverviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  Loading activities...
                </div>
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${getActivityColor(
                      activity.type
                    )}`}
                  ></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {formatActivityType(activity.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">
                  No recent activities
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  View All Activity
                </Button>
              </DialogTrigger>
              <DialogContent className="!max-w-6xl max-h-[85vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Recent Activity</DialogTitle>
                </DialogHeader>                <div className="overflow-y-auto max-h-[75vh] pr-2">
                  <RecentActivity enableInfiniteScroll={true} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
