'use client';

import QuickStatsGrid from './QuickStatsGrid';
import ActivityOverview from './ActivityOverview';
import SecurityStatus from './SecurityStatus';
import QuickActions from './QuickActions';
import DataExport from './DataExport';
import type { AdminDashboardProps } from './types';
import { defaultSecurityStats } from './utils';
import { useActivitiesQuery, useSecurityData } from '@/hooks';

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  // Use TanStack Query hooks for better performance and caching
  const { data: activitiesResponse, isLoading: activitiesLoading } =
    useActivitiesQuery({
      limit: 3, // Only fetch 3 recent activities for dashboard overview
    });

  const { data: securityResponse, isLoading: securityLoading } =    useSecurityData();

  // Extract data from responses
  const recentActivities = activitiesResponse?.activities || [];
  const securityStats = securityResponse?.stats || defaultSecurityStats;

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <QuickStatsGrid stats={stats} />
      {/* Activity Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityOverview
          activities={recentActivities}
          loading={activitiesLoading}
        />
        <SecurityStatus
          securityStats={securityStats}
          loading={securityLoading}
        />
      </div>      {/* Quick Actions */}
      <QuickActions />
      {/* Data Export */}
      <DataExport />
    </div>
  );
}
