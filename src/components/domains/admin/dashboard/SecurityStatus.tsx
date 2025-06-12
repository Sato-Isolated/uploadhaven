'use client';

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import SecurityPanel from '@/components/domains/security/panel';
import { Shield } from 'lucide-react';
import type { SecurityStats } from './types';

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
      <Card className="border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Security Status
          </CardTitle>
          <CardDescription>System security overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium">System Status</span>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
              >
                Healthy
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Security Events</span>
                <span className="font-medium">
                  {loading ? '...' : securityStats.totalEvents}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rate Limit Hits</span>
                <span className="font-medium">
                  {loading ? '...' : securityStats.rateLimitHits}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Blocked IPs</span>
                <span className="font-medium">
                  {loading ? '...' : securityStats.blockedIPs}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  Security Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] !max-w-6xl overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Security Dashboard</DialogTitle>
                </DialogHeader>
                <div className="max-h-[75vh] overflow-y-auto pr-2">
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
