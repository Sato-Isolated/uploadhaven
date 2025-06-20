/**
 * Audit Logs Dashboard Component
 * Comprehensive audit log viewing with filtering, searching, and export
 */

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Eye, 
  Filter, 
  Search, 
  Calendar,
  AlertTriangle,
  Shield,
  User,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAuditLogs, useAuditStats, useExportAuditLogs } from '@/hooks/useAuditLogs';
import type { AuditLogFilters, AuditLog, AuditCategory, AuditSeverity } from '@/types/audit';

// =============================================================================
// Types
// =============================================================================

interface AuditLogsDashboardProps {
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export default function AuditLogsDashboard({ className }: AuditLogsDashboardProps) {
  // State for filters
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
    sortBy: 'timestamp',
    sortOrder: 'desc'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Queries
  const { 
    data: auditLogsData, 
    isLoading: isLoadingLogs, 
    error: logsError,
    refetch: refetchLogs 
  } = useAuditLogs({ filters });
  
  const { 
    data: auditStats, 
    isLoading: isLoadingStats 
  } = useAuditStats({ timeRange: selectedTimeRange });

  const exportMutation = useExportAuditLogs();
  // Handlers
  const handleFilterChange = (key: keyof AuditLogFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset pagination
    }));
  };

  const handleSearch = () => {
    handleFilterChange('search', searchTerm || undefined);
  };

  const handleExport = (format: 'json' | 'csv' | 'xlsx') => {
    exportMutation.mutate({
      format,
      filters,
      includeMetadata: true,
      includeEncrypted: false
    });
  };

  const handlePagination = (direction: 'prev' | 'next') => {
    const currentOffset = filters.offset || 0;
    const limit = filters.limit || 50;
    
    if (direction === 'next') {
      handleFilterChange('offset', currentOffset + limit);
    } else {
      handleFilterChange('offset', Math.max(0, currentOffset - limit));
    }
  };

  const toggleRowExpansion = (logId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // Memoized values
  const severityOptions: { value: AuditSeverity; label: string; color: string }[] = [
    { value: 'info', label: 'Info', color: 'bg-blue-100 text-blue-800' },
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const categoryOptions: { value: AuditCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'user_action', label: 'User Actions', icon: <User className="w-4 h-4" /> },
    { value: 'admin_action', label: 'Admin Actions', icon: <Settings className="w-4 h-4" /> },
    { value: 'security_event', label: 'Security Events', icon: <Shield className="w-4 h-4" /> },
    { value: 'system_event', label: 'System Events', icon: <AlertTriangle className="w-4 h-4" /> },
    { value: 'file_operation', label: 'File Operations', icon: <Eye className="w-4 h-4" /> },
    { value: 'auth_event', label: 'Authentication', icon: <User className="w-4 h-4" /> },
    { value: 'data_access', label: 'Data Access', icon: <Eye className="w-4 h-4" /> },
    { value: 'compliance', label: 'Compliance', icon: <Shield className="w-4 h-4" /> }
  ];

  const getSeverityBadge = (severity: AuditSeverity) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return (
      <Badge className={option?.color || 'bg-gray-100 text-gray-800'}>
        {option?.label || severity}
      </Badge>
    );
  };

  const getCategoryIcon = (category: AuditCategory) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option?.icon || <Settings className="w-4 h-4" />;
  };

  const getUserIdentifier = (log: AuditLog) => {
    if ('userId' in log && log.userId) return log.userId;
    if ('adminId' in log && log.adminId) return log.adminId;
    return 'System';
  };

  if (logsError) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load audit logs. Please try again or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (    <div className={`space-y-6 ${className}`}>      {/* Header */}      <div key="audit-logs-dashboard-header" className="flex items-center justify-between">
        <div key="audit-logs-dashboard-header-text">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Audit Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and analyze system activity
          </p>
        </div>
        
        <div key="audit-logs-dashboard-header-actions" className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchLogs()}
            disabled={isLoadingLogs}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="1h" value="1h">1 Hour</SelectItem>
              <SelectItem key="24h" value="24h">24 Hours</SelectItem>
              <SelectItem key="7d" value="7d">7 Days</SelectItem>
              <SelectItem key="30d" value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
        {/* Statistics */}
      {auditStats && (
        <div key="audit-logs-dashboard-statistics" className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              key: 'total-logs',
              title: 'Total Logs',
              value: auditStats.totalLogs.toLocaleString(),
              icon: <Eye className="w-8 h-8 text-blue-600" />,
            },
            {
              key: 'security-events',
              title: 'Security Events',
              value: auditStats.securityEvents.total.toLocaleString(),
              icon: <Shield className="w-8 h-8 text-orange-600" />,
            },
            {
              key: 'critical-events',
              title: 'Critical Events',
              value: auditStats.securityEvents.critical.toLocaleString(),
              icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
            },
            {
              key: 'last-24h',
              title: 'Last 24h',
              value: auditStats.last24Hours.toLocaleString(),
              icon: <Calendar className="w-8 h-8 text-green-600" />,
            },
          ].map((stat) => (
            <Card key={stat.key}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                      {isLoadingStats ? '...' : stat.value}
                    </p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}      {/* Filters */}
      <Card key="audit-logs-dashboard-filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Filter audit logs by category, severity, date range, and more
          </CardDescription>
        </CardHeader>        <CardContent className="space-y-4">
          {/* Search */}
          <div key="audit-logs-dashboard-search" className="flex items-center gap-2">
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <div key="audit-logs-dashboard-filter-grid" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <Select 
              value={filters.category as string || 'all'} 
              onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select 
              value={filters.severity as string || 'all'} 
              onValueChange={(value) => handleFilterChange('severity', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {severityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select 
              value={filters.status as string || 'all'} 
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>              <SelectContent>
                <SelectItem key="all" value="all">All Statuses</SelectItem>
                <SelectItem key="success" value="success">Success</SelectItem>
                <SelectItem key="failure" value="failure">Failure</SelectItem>
                <SelectItem key="pending" value="pending">Pending</SelectItem>
                <SelectItem key="cancelled" value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Select onValueChange={handleExport}>
              <SelectTrigger>
                <SelectValue placeholder="Export..." />
              </SelectTrigger>              <SelectContent>
                <SelectItem key="json" value="json">Export as JSON</SelectItem>
                <SelectItem key="csv" value="csv">Export as CSV</SelectItem>
                <SelectItem key="xlsx" value="xlsx">Export as Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>      {/* Audit Logs List */}
      <Card key="audit-logs-dashboard-logs-list">
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            {auditLogsData ? `Showing ${auditLogsData.logs.length} of ${auditLogsData.total} logs` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : auditLogsData?.logs.length ? (            <div className="space-y-4">
              {auditLogsData.logs.map((log, index) => (
                <Card key={`audit-log-${log.id}-${index}`} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div key={`audit-log-content-${log.id}-${index}`} className="flex items-start justify-between">
                      <div key={`audit-log-details-${log.id}-${index}`} className="flex-1 space-y-2">
                        <div key={`audit-log-action-badges-${log.id}-${index}`} className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(log.category)}
                            <span className="font-medium">{log.action}</span>
                          </div>
                          {getSeverityBadge(log.severity)}
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                            {log.status}
                          </Badge>
                        </div>
                        
                        <p key={`audit-log-description-${log.id}-${index}`} className="text-sm text-gray-600 dark:text-gray-400">
                          {log.description}
                        </p>
                        
                        <div key={`audit-log-metadata-${log.id}-${index}`} className="flex items-center gap-4 text-xs text-gray-500">
                          <span key={`audit-log-timestamp-${log.id}-${index}`}>{format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}</span>
                          <span key={`audit-log-user-${log.id}-${index}`}>User: {getUserIdentifier(log)}</span>
                          <span key={`audit-log-category-${log.id}-${index}`}>Category: {log.category}</span>
                        </div>
                      </div>
                        <Button
                        key={`audit-log-expand-button-${log.id}-${index}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(log.id)}
                      >
                        {expandedRows.has(log.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {expandedRows.has(log.id) && (
                      <div key={`audit-log-expanded-${log.id}-${index}`} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div key={`audit-log-expanded-grid-${log.id}-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div key={`audit-log-details-section-${log.id}-${index}`}>
                            <h4 className="font-medium mb-2">Log Details</h4>
                            <dl className="space-y-1">
                              <div key={`audit-log-detail-id-${log.id}-${index}`} className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">ID:</dt>
                                <dd className="font-mono">{log.id}</dd>
                              </div>
                              <div key={`audit-log-detail-session-${log.id}-${index}`} className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">Session:</dt>
                                <dd className="font-mono">{log.sessionId || 'N/A'}</dd>
                              </div>
                              <div key={`audit-log-detail-ip-${log.id}-${index}`} className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">IP Hash:</dt>
                                <dd className="font-mono">{log.ipHash}</dd>
                              </div>
                              <div key={`audit-log-detail-useragent-${log.id}-${index}`} className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">User Agent:</dt>
                                <dd className="text-xs truncate max-w-xs">{log.userAgent || 'N/A'}</dd>
                              </div>
                            </dl>
                          </div>                          
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div key={`audit-log-metadata-section-${log.id}-${index}`}>
                              <h4 className="font-medium mb-2">Metadata</h4>
                              <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              <div key="audit-logs-dashboard-pagination" className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(filters.offset || 0) + 1} to {Math.min((filters.offset || 0) + (filters.limit || 50), auditLogsData.total)} of {auditLogsData.total} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePagination('prev')}
                    disabled={(filters.offset || 0) === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePagination('next')}
                    disabled={!auditLogsData.hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
