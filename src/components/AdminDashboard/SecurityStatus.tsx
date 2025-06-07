"use client";

import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SecurityPanel from "@/components/SecurityPanel";
import { Shield } from "lucide-react";
import type { SecurityStats } from "./types";

interface SecurityStatusProps {
  securityStats: SecurityStats;
  loading: boolean;
}

export default function SecurityStatus({
  securityStats,
  loading,
}: SecurityStatusProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Security Status
          </CardTitle>
          <CardDescription>System security overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium">System Status</span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700"
              >
                Healthy
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Security Events</span>
                <span className="font-medium">
                  {loading ? "..." : securityStats.totalEvents}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rate Limit Hits</span>
                <span className="font-medium">
                  {loading ? "..." : securityStats.rateLimitHits}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Blocked IPs</span>
                <span className="font-medium">
                  {loading ? "..." : securityStats.blockedIPs}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  Security Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent className="!max-w-6xl max-h-[85vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Security Dashboard</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[75vh] pr-2">
                  <SecurityPanel />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
