/**
 * 🔐 Privacy Status Dashboard - Security & Audit Overview
 * 
 * Dashboard component displaying privacy status, security indicators,
 * and audit statistics in a user-friendly format.
 * 
 * @domain privacy
 * @pattern Presentation Component (DDD)
 * @privacy zero-knowledge - only displays anonymized data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PrivacyIndicator, PrivacyStatusGrid } from './PrivacyIndicator';
import { usePrivacyMonitoring } from '../hooks/usePrivacyMonitoring';
import { SecurityEventStats } from '../../domain/repositories/ISecurityEventRepository';

/**
 * Privacy Dashboard props
 */
export interface PrivacyDashboardProps {
  readonly className?: string;
  readonly showDetailedStats?: boolean;
  readonly timeRange?: { from: Date; to: Date };
}

/**
 * Stats card component
 */
interface StatsCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly description?: string;
  readonly trend?: 'up' | 'down' | 'stable';
  readonly icon?: string;
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center space-x-3">
        {icon && (
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Privacy Status Dashboard Component
 */
export function PrivacyDashboard({
  className = '',
  showDetailedStats = true,
  timeRange,
}: PrivacyDashboardProps) {
  const {
    privacyStatus,
    isLoading,
    error,
    getAuditStats,
    refreshStatus,
  } = usePrivacyMonitoring();

  const [auditStats, setAuditStats] = useState<SecurityEventStats | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  /**
   * Load audit statistics
   */
  useEffect(() => {
    const loadStats = async () => {
      if (showDetailedStats) {
        const stats = await getAuditStats(timeRange);
        setAuditStats(stats);
        setLastRefresh(new Date());
      }
    };

    loadStats();
  }, [getAuditStats, showDetailedStats, timeRange]);

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    await refreshStatus();
    const stats = await getAuditStats(timeRange);
    setAuditStats(stats);
    setLastRefresh(new Date());
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Privacy Status Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            🔒 Privacy Status
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            aria-label="Refresh privacy status"
          >
            {isLoading ? '⟳ Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Privacy Indicators */}
        <PrivacyStatusGrid
          indicators={['zero-knowledge', 'anonymous', 'encrypted', 'temporary']}
          size="md"
          className="mb-4"
        />

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${privacyStatus.complianceStatus === 'compliant'
                ? 'bg-green-100 text-green-800'
                : privacyStatus.complianceStatus === 'warning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
              {privacyStatus.complianceStatus}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Privacy Level:</span>
            <span className="text-gray-900 capitalize">
              {privacyStatus.privacyLevel}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Monitoring:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${privacyStatus.isMonitoring
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
              }`}>
              {privacyStatus.isMonitoring ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <span className="font-medium">Privacy Error:</span> {error}
          </p>
        </div>
      )}

      {/* Detailed Statistics */}
      {showDetailedStats && auditStats && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📊 Audit Statistics
            </h3>
            {lastRefresh && (
              <p className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Events"
              value={auditStats.totalEvents.toLocaleString()}
              description="Privacy-compliant audit events"
              icon="📝"
            />

            <StatsCard
              title="Events per Hour"
              value={auditStats.eventsPerHour.toFixed(1)}
              description="Average activity rate"
              icon="⏱️"
            />

            <StatsCard
              title="Today's Events"
              value={privacyStatus.eventsToday}
              description="Events logged today"
              icon="📅"
            />

            <StatsCard
              title="Privacy Level"
              value={privacyStatus.privacyLevel}
              description="Current data protection level"
              icon="🛡️"
            />
          </div>

          {/* Event Type Breakdown */}
          {Object.keys(auditStats.eventsByType).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Event Types</h4>
              <div className="space-y-2">
                {Object.entries(auditStats.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {type.replace('_', ' ')}
                    </span>
                    <span className="font-medium text-gray-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Severity Breakdown */}
          {Object.keys(auditStats.eventsBySeverity).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Event Severity</h4>
              <div className="space-y-2">
                {Object.entries(auditStats.eventsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="flex items-center justify-between text-sm">
                    <span className={`capitalize ${severity === 'critical' ? 'text-red-600 font-medium' :
                        severity === 'high' ? 'text-orange-600' :
                          severity === 'medium' ? 'text-yellow-600' :
                            'text-gray-600'
                      }`}>
                      {severity}
                    </span>
                    <span className="font-medium text-gray-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Privacy Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          🔐 Privacy Protection Information
        </h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• All audit data is anonymized and hashed for privacy protection</p>
          <p>• No personal information or file contents are ever logged</p>
          <p>• Event statistics help improve security without compromising privacy</p>
          <p>• Data is automatically deleted according to retention policies</p>
        </div>
      </div>
    </div>
  );
}
