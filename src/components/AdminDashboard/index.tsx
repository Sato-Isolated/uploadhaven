"use client";

import QuickStatsGrid from "./QuickStatsGrid";
import ActivityOverview from "./ActivityOverview";
import SecurityStatus from "./SecurityStatus";
import QuickActions from "./QuickActions";
import DataExport from "./DataExport";
import { SecurityScanModal } from "./modals";
import type {
  AdminDashboardProps,
  ActivityEvent,
  SecurityStats,
} from "./types";
import { defaultSecurityStats } from "./utils";
import { useApi, useModal } from "@/hooks";

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  // Use useModal hook for modal management
  const {
    isOpen: showSecurityModal,
    openModal: openSecurityModal,
    closeModal: closeSecurityModal,
  } = useModal();

  // Replace manual API calls with useApi hooks
  const { data: activitiesResponse, loading: activitiesLoading } = useApi<{
    activities: ActivityEvent[];
  }>("/api/admin/activities?limit=3");

  const { data: securityResponse, loading: securityLoading } = useApi<{
    stats: SecurityStats;
  }>("/api/security");

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
