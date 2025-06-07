"use client";

import { useState, useEffect } from "react";
import QuickStatsGrid from "./QuickStatsGrid";
import ActivityOverview from "./ActivityOverview";
import SecurityStatus from "./SecurityStatus";
import QuickActions from "./QuickActions";
import DataExport from "./DataExport";
import {
  ManageUsersModal,
  FileCleanupModal,
  SecurityScanModal,
  SystemLogsModal,
} from "./modals";
import type {
  AdminDashboardProps,
  ActivityEvent,
  SecurityStats,
  User,
  FileData,
} from "./types";
import { defaultSecurityStats } from "./utils";

export default function AdminDashboard({ stats }: AdminDashboardProps) {
  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [securityStats, setSecurityStats] =
    useState<SecurityStats>(defaultSecurityStats);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);

  // Modal states
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

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
    };

    fetchRecentActivities();
    fetchSecurityStats();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchFiles = async () => {
    setFilesLoading(true);
    try {
      const response = await fetch("/api/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleManageUsers = () => {
    setShowUsersModal(true);
    if (users.length === 0) {
      fetchUsers();
    }
  };

  const handleFileCleanup = () => {
    setShowFilesModal(true);
    if (files.length === 0) {
      fetchFiles();
    }
  };

  const handleSecurityScan = () => {
    setShowSecurityModal(true);
  };

  const handleSystemLogs = () => {
    setShowLogsModal(true);
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
      <QuickActions
        onManageUsers={handleManageUsers}
        onFileCleanup={handleFileCleanup}
        onSecurityScan={handleSecurityScan}
        onSystemLogs={handleSystemLogs}
      />
      {/* Data Export */}
      <DataExport />
      {/* Modals */}
      <ManageUsersModal
        isOpen={showUsersModal}
        onOpenChange={setShowUsersModal}
        users={users}
        loading={usersLoading}
      />
      <FileCleanupModal
        isOpen={showFilesModal}
        onOpenChange={setShowFilesModal}
        files={files}
        loading={filesLoading}
      />
      <SecurityScanModal
        isOpen={showSecurityModal}
        onOpenChange={setShowSecurityModal}
      />
      <SystemLogsModal isOpen={showLogsModal} onOpenChange={setShowLogsModal} />
    </div>
  );
}
