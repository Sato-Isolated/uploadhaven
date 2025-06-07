import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, X } from "lucide-react";
import { SecurityEvent } from "../types";

interface SecurityAlertProps {
  event: SecurityEvent;
  onDismiss: () => void;
}

export default function SecurityAlert({
  event,
  onDismiss,
}: SecurityAlertProps) {
  const isHighPriority =
    event.severity === "critical" || event.severity === "high";

  if (!isHighPriority) {
    return null;
  }

  return (
    <Alert
      className={`mb-4 ${
        event.severity === "critical"
          ? "border-red-500 bg-red-50 dark:bg-red-950"
          : "border-orange-500 bg-orange-50 dark:bg-orange-950"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {event.severity === "critical" ? (
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          ) : (
            <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertTitle className="mb-1 flex items-center gap-2">
              {event.severity === "critical"
                ? "Critical Security Alert"
                : "High Priority Alert"}
              <Badge
                variant="outline"
                className={
                  event.severity === "critical"
                    ? "text-red-600 border-red-300 bg-red-100 dark:text-red-400 dark:border-red-800 dark:bg-red-900"
                    : "text-orange-600 border-orange-300 bg-orange-100 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-900"
                }
              >
                {event.severity.toUpperCase()}
              </Badge>
            </AlertTitle>
            <AlertDescription className="text-sm">
              <div className="mb-2">
                <strong>{event.message}</strong>
              </div>
              {event.details.ip && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Source IP:
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    {event.details.ip}
                  </code>
                </div>
              )}
              {event.details.filename && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  File:
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    {event.details.filename}
                  </code>
                </div>
              )}
              {event.details.reason && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Reason: {event.details.reason}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
}
