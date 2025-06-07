import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import SecurityHeader from "./components/SecurityHeader";
import SecurityActions from "./components/SecurityActions";
import SecurityStatsGrid from "./components/SecurityStatsGrid";
import SecurityEventsList from "./components/SecurityEventsList";
import SecurityAlert from "./components/SecurityAlert";
import { SecurityEvent, SecurityStats, SecurityEventAPI } from "./types";

export default function SecurityPanel() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    rateLimitHits: 0,
    invalidFiles: 0,
    blockedIPs: 0,
    last24h: 0,
    malwareDetected: 0,
    largeSizeBlocked: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );

  // Get critical/high severity events that haven't been dismissed
  const activeAlerts = events.filter(
    (event) =>
      (event.severity === "critical" || event.severity === "high") &&
      !dismissedAlerts.has(event.id)
  );
  const loadSecurityData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/security?include_events=true");
      if (!response.ok) {
        throw new Error(`Failed to load security data: ${response.status}`);
      }

      const data = await response.json(); // Transform API data to match SecurityEvent interface
      const transformedEvents = (data.events || []).map(
        (event: SecurityEventAPI) => ({
          id: event.id,
          type: event.type,
          message: event.details || `${event.type} event`, // Use details as message
          severity: event.severity,
          timestamp: new Date(event.timestamp), // Convert timestamp
          details: {
            ip: event.ip,
            filename: event.filename,
            fileSize: event.fileSize,
            userAgent: event.userAgent,
            endpoint: event.endpoint,
            reason: event.reason,
          },
        })
      );

      setEvents(transformedEvents);
      setStats(
        data.stats || {
          totalEvents: 0,
          rateLimitHits: 0,
          invalidFiles: 0,
          blockedIPs: 0,
          last24h: 0,
          malwareDetected: 0,
          largeSizeBlocked: 0,
        }
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load security data";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const exportSecurityLogs = async () => {
    try {
      const response = await fetch("/api/security/export");
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `security-logs-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Security logs exported successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export security logs";
      toast.error(errorMessage);
    }
  };
  const clearSecurityLogs = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all security logs? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/security/clear", { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`Clear failed: ${response.status}`);
      }
      setEvents([]);
      setStats({
        totalEvents: 0,
        rateLimitHits: 0,
        invalidFiles: 0,
        blockedIPs: 0,
        last24h: 0,
        malwareDetected: 0,
        largeSizeBlocked: 0,
      });
      toast.success("Security logs cleared successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear security logs";
      toast.error(errorMessage);
    }
  };
  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);
  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  return (
    <div className="space-y-6">
      <SecurityHeader
        title="Security Dashboard"
        description="Monitor security events, rate limits, and potential threats to your file upload service."
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
