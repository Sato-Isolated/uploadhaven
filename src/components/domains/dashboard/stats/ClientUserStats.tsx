'use client';

import { motion } from 'motion/react';
import { BaseComponentProps } from '@/types';
import { useClientUserStats } from './hooks/useClientUserStats';
import { UserStatsLoadingState } from './components/UserStatsLoadingState';
import { UserStatsErrorState } from './components/UserStatsErrorState';
import { UserStatsCards } from './components/UserStatsCards';

interface UserStatsProps extends BaseComponentProps {
  userId: string;
  session?: { user?: unknown }; // Add session prop to check authentication
}

export default function ClientUserStats({ userId, session }: UserStatsProps) {
  const { isAuthenticated, stats, loading, error } = useClientUserStats(
    userId,
    session
  );

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return <UserStatsLoadingState />;
  }

  if (error) {
    return <UserStatsErrorState error={error} />;
  }

  if (!stats) {
    return null;
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Overview Cards */}
      <UserStatsCards stats={stats} />
    </motion.div>
  );
}
