// DashboardClient following SRP principles
// Responsibility: Pure orchestration of dashboard components

'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import type { DashboardProps } from './types';
import { DashboardContainer } from './components/layout/DashboardContainer';
import { DashboardHeader } from './components/layout/DashboardHeader';

import { UserStatsGrid } from './components/stats/UserStatsGrid';
import { DashboardUploadArea } from './upload/DashboardUploadArea';
import FilesManager from './components/files/FilesManager';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useDashboardData } from './hooks';
import { DebugNotifications } from '../notifications/DebugNotifications';

export function DashboardClient({ session }: DashboardProps) {  // Extract user information
  const userId = session?.user?.id;
  const userName = session?.user?.name || session?.user?.email || 'User';
  // Centralized data management
  const {
    stats,
    isLoading,
    error,
    isAuthenticated,
    logActivity,
  } = useDashboardData({ userId, enabled: Boolean(userId) });// Log user activity on mount
  useEffect(() => {
    if (isAuthenticated) {
      logActivity();
    }
  }, [isAuthenticated, logActivity]);return (
    <ErrorBoundary>
      <DashboardContainer>        {/* Header */}
        <DashboardHeader userName={userName} />        {/* Main Content Layout - Stats + Upload | Files */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Stats + Upload (larger) */}
          <div className="w-full lg:flex-[2] space-y-6">
            {/* User Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <UserStatsGrid
                stats={stats || {
                  totalFiles: 0,
                  totalSize: 0,
                  recentUploads: 0,
                  expiringSoon: 0,
                  filesThisWeek: 0,
                  averageFileSize: 0,
                  mostUsedType: 'document',
                }}
                isLoading={isLoading}
                statsError={error}
              />
            </motion.div>
              {/* Upload Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <DashboardUploadArea />
            </motion.div>

            {/* Debug Component - Temporary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <DebugNotifications />
            </motion.div>
          </div>{/* Right Column - Files Manager (smaller) */}
          <div className="w-full lg:flex-[1] min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="h-[500px]"
            >
              <FilesManager className="h-full" />
            </motion.div>
          </div>
        </div>
      </DashboardContainer>
    </ErrorBoundary>
  );
}

export default DashboardClient;
