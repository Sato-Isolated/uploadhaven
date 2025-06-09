"use client";

import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useApi } from "@/hooks";
import ClientUserStats from "@/components/ClientUserStats";
import {
  DashboardHeader,
  QuickActionCards,
  DashboardUploadArea,
} from "@/components/Dashboard";

interface DashboardClientProps {
  session: {
    user: {
      id: string;
      name?: string;
      email: string;
    };
  };
}

export default function DashboardClient({ session }: DashboardClientProps) {
  // Stabilize the user ID to prevent unnecessary re-renders
  const userId = useMemo(() => session?.user?.id, [session?.user?.id]);

  // Replace manual fetch with useApi hook for user activity logging
  const { refetch: logUserActivity } = useApi("/api/user/activity", {
    immediate: false, // Don't fetch immediately, only when triggered
    method: "POST", // Use POST method for activity tracking
  });

  // Log activity when dashboard loads - only depend on stable userId
  useEffect(() => {
    if (userId) {
      logUserActivity();
    }
  }, [userId, logUserActivity]);

  const userName = session.user.name || session.user.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <DashboardHeader userName={userName} />
        {/* Quick Action Cards */}
        <QuickActionCards /> {/* Enhanced Upload Area */}
        <DashboardUploadArea />        {/* Enhanced Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <ClientUserStats userId={session.user.id} session={session} />
        </motion.div>
      </div>
    </div>
  );
}
