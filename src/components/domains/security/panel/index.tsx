import { useState } from 'react';
import SecurityHeader from './components/SecurityHeader';
import SecurityActions from './components/SecurityActions';
import SecurityStatsGrid from './components/SecurityStatsGrid';
import SecurityEventsList from './components/SecurityEventsList';
import SecurityAlert from './components/SecurityAlert';
import {
  useSecurityData,
  useExportSecurityLogs,
  useClearSecurityLogs,
} from '@/hooks';
import { useTranslations } from 'next-intl';

export default function SecurityPanel() {
  const t = useTranslations('Security');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );
  // Use TanStack Query for security data
  const {
    data: securityData,
    isLoading,
    refetch: loadSecurityData,
  } = useSecurityData();

  // Use TanStack Query mutations for security actions
  const exportLogsMutation = useExportSecurityLogs();
  const clearLogsMutation = useClearSecurityLogs();

  // Extract events and stats from response
  const events = securityData?.events || [];
  const stats = securityData?.stats || {
    totalEvents: 0,
    rateLimitHits: 0,
    invalidFiles: 0,
    blockedIPs: 0,
    last24h: 0,
    malwareDetected: 0,
    largeSizeBlocked: 0,
  };

  // Get critical/high severity events that haven't been dismissed
  const activeAlerts = events.filter(
    (event) =>
      (event.severity === 'critical' || event.severity === 'high') &&
      !dismissedAlerts.has(event.id)
  );
  const exportSecurityLogs = () => {
    exportLogsMutation.mutate();
  };
  const clearSecurityLogs = () => {
    if (
      !confirm(
        t('clearLogsConfirmation')
      )
    ) {
      return;
    }

    clearLogsMutation.mutate();
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  return (
    <div className="space-y-6">
      <SecurityHeader
        title={t('securityDashboard')}
        description={t('securityDashboardDescription')}
      />

      {/* Security Alerts for Critical/High Events */}
      {activeAlerts.map((alert) => (
        <SecurityAlert
          key={alert.id}
          event={alert}
          onDismiss={() => dismissAlert(alert.id)}
        />
      ))}

      <SecurityActions
        onRefresh={loadSecurityData}
        onExport={exportSecurityLogs}
        onClear={clearSecurityLogs}
        isLoading={isLoading}
      />

      <SecurityStatsGrid stats={stats} isLoading={isLoading} />

      <SecurityEventsList events={events} isLoading={isLoading} />
    </div>
  );
}
