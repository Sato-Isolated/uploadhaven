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
import { FileText, Users, Shield, Clock } from "lucide-react";

interface QuickActionsProps {
  onManageUsers: () => void;
  onFileCleanup: () => void;
  onSecurityScan: () => void;
  onSystemLogs: () => void;
}

export default function QuickActions({
  onManageUsers,
  onFileCleanup,
  onSecurityScan,
  onSystemLogs,
}: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col gap-3 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-200 dark:hover:from-blue-900 dark:hover:to-indigo-800 transition-all duration-200"
              onClick={onManageUsers}
            >
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Manage Users
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col gap-3 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 border-emerald-200 dark:border-emerald-800 hover:from-emerald-100 hover:to-green-200 dark:hover:from-emerald-900 dark:hover:to-green-800 transition-all duration-200"
              onClick={onFileCleanup}
            >
              <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                File Cleanup
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col gap-3 bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-950 dark:to-red-900 border-orange-200 dark:border-orange-800 hover:from-orange-100 hover:to-red-200 dark:hover:from-orange-900 dark:hover:to-red-800 transition-all duration-200"
              onClick={onSecurityScan}
            >
              <Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Security Scan
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-6 flex flex-col gap-3 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200 dark:border-purple-800 hover:from-purple-100 hover:to-violet-200 dark:hover:from-purple-900 dark:hover:to-violet-800 transition-all duration-200"
              onClick={onSystemLogs}
            >
              <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                System Logs
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
