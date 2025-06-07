"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import ClientUserStats from "@/components/ClientUserStats";
import {
  DashboardHeader,
  QuickActionCards,
  FilesOverviewCard,
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
  // Log activity when dashboard loads
  useEffect(() => {
    if (session?.user) {
      logUserActivity();
    }
  }, [session]);

  const logUserActivity = async () => {
    try {
      // Update user's lastActivity
      await fetch("/api/user/stats", {
        method: "GET",
      });
    } catch (error) {
      console.error("Failed to log user activity:", error);
    }
  };

  const userName = session.user.name || session.user.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <DashboardHeader userName={userName} />

        {/* Quick Action Cards */}
        <QuickActionCards />

        {/* Enhanced Files Overview */}
        <FilesOverviewCard />

        {/* Enhanced Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <ClientUserStats userId={session.user.id} />
        </motion.div>
      </div>
    </div>
  );
}
