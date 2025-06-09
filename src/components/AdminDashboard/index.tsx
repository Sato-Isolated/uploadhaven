"use client";

import { useState, useEffect } from "react";
import QuickStatsGrid from "./QuickStatsGrid";
import ActivityOverview from "./ActivityOverview";
import SecurityStatus from "./SecurityStatus";
import QuickActions from "./QuickActions";
import DataExport from "./DataExport";
import {
  SecurityScanModal,
} from "./modals";
import type {
  AdminDashboardProps,
  ActivityEvent,
  SecurityStats,
} from "./types";
import { defaultSecurityStats } from "./utils";

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);  const [securityStats, setSecurityStats] =
    useState<SecurityStats>(defaultSecurityStats);
  const [securityLoading, setSecurityLoading] = useState(true);
  // Modal states
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const response = await fetch("/api/admin/activities?limit=3");
        if (response.ok) {
          const data = await response.json();
          setRecentActivities(data.activities || []);
        }
      } catch (error) {
        console.error("Failed to fetch recent activities:", error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    const fetchSecurityStats = async () => {
      try {
        const response = await fetch("/api/security");
        if (response.ok) {
          const data = await response.json();
          setSecurityStats(data.stats || defaultSecurityStats);
        }
      } catch (error) {
        console.error("Failed to fetch security stats:", error);
      } finally {
        setSecurityLoading(false);
      }
    };    fetchRecentActivities();
    fetchSecurityStats();
  }, []);
  const handleSecurityScan = () => {
    setShowSecurityModal(true);
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
      </div>      {/* Quick Actions */}          <QuickActions
            onSecurityScan={handleSecurityScan}
          />
      {/* Data Export */}
      <DataExport />      {/* Modals */}
      <SecurityScanModal
        isOpen={showSecurityModal}
        onOpenChange={setShowSecurityModal}
      />
    </div>
  );
}
