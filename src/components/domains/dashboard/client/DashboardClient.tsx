"use client";

import { useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { useLogUserActivity } from "@/hooks";
import { useRealTimeActivities } from "@/hooks/useRealTimePolling";
import ClientUserStats from "@/components/domains/dashboard/stats/ClientUserStats";
import {
  DashboardHeader,
  QuickActionCards,
  DashboardUploadArea,
} from "@/components/domains/dashboard/client";

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
  const userId = useMemo(() => session?.user?.id, [session?.user?.id]);  // Use TanStack Query mutation for user activity logging
  const { mutate: logUserActivity } = useLogUserActivity();
  // Enable real-time updates for activities using polling
  const { 
    isConnected: realtimeConnected, 
    latestActivity, 
    activityCount, 
    resetActivityCount 
  } = useRealTimeActivities();

  // Log activity when dashboard loads - useEffect is appropriate for side effects
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
        <DashboardUploadArea /> {/* Enhanced Quick Stats */}
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
