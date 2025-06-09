"use client";

import QuickStatsGrid from "./QuickStatsGrid";
import ActivityOverview from "./ActivityOverview";
import SecurityStatus from "./SecurityStatus";
import QuickActions from "./QuickActions";
import DataExport from "./DataExport";
import { SecurityScanModal } from "./modals";
import type {
  AdminDashboardProps,
  SecurityStats,
} from "./types";
import { ActivityEvent } from "@/components/types/common";
import { defaultSecurityStats } from "./utils";
import { useActivitiesQuery, useSecurityData, useModal } from "@/hooks";

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  // Use useModal hook for modal management
  const {
    isOpen: showSecurityModal,
    openModal: openSecurityModal,
    closeModal: closeSecurityModal,
  } = useModal();
  // Use TanStack Query hooks for better performance and caching
  const { data: activitiesResponse, isLoading: activitiesLoading } = useActivitiesQuery({
    limit: 3, // Only fetch 3 recent activities for dashboard overview
  });

  const { data: securityResponse, isLoading: securityLoading } = useSecurityData();

  // Extract data from responses
  const recentActivities = activitiesResponse?.activities || [];
  const securityStats = securityResponse?.stats || defaultSecurityStats;
  const handleSecurityScan = () => {
    openSecurityModal();
  };

  const handleSecurityModalChange = (open: boolean) => {
    if (open) {
      openSecurityModal();
    } else {
      closeSecurityModal();
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <QuickStatsGrid stats={stats} />
      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityOverview
          activities={recentActivities}
          loading={activitiesLoading}
        />
        <SecurityStatus
          securityStats={securityStats}
          loading={securityLoading}
        />
      </div>
      {/* Quick Actions */} 
      <QuickActions onSecurityScan={handleSecurityScan} />
      {/* Data Export */}
      <DataExport /> 
      {/* Modals */}
      <SecurityScanModal
        isOpen={showSecurityModal}
        onOpenChange={handleSecurityModalChange}
      />
    </div>
  );
}
