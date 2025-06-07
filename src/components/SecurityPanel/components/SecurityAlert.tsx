import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, X, Clock, Globe, File } from "lucide-react";
import { SecurityEvent } from "../types";
import { formatTimestamp } from "../utils";

interface SecurityAlertProps {
  event: SecurityEvent;
  onDismiss: () => void;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

function getEventTypeDisplay(type: string): { label: string; color: string } {
  const types = {
    rate_limit: {
      label: "Rate Limit Exceeded",
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    },
    invalid_file: {
      label: "Invalid File Type",
      color:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    },
    blocked_ip: {
      label: "IP Blocked",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    },
    malware_detected: {
      label: "Malware Detected",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    },
    large_file: {
      label: "File Too Large",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    access_denied: {
      label: "Access Denied",
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    },
    suspicious_activity: {
      label: "Suspicious Activity",
      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    },
  };
  return (
    types[type as keyof typeof types] || {
      label: type,
      color: "bg-gray-100 text-gray-800",
    }
  );
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

  const eventTypeInfo = getEventTypeDisplay(event.type);

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
            <AlertTitle className="mb-2 flex items-center gap-2 flex-wrap">
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
              <Badge className={eventTypeInfo.color}>
                {eventTypeInfo.label}
              </Badge>
            </AlertTitle>

            <AlertDescription className="text-sm space-y-2">
              <div className="mb-3">
                <strong className="text-base">{event.message}</strong>
              </div>

              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {/* Timestamp */}
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">Time:</span>
                  <span>{formatTimestamp(event.timestamp)}</span>
                </div>

                {/* IP Address */}
                {event.details.ip && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Globe className="w-3 h-3" />
                    <span className="font-medium">IP:</span>
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">
                      {event.details.ip}
                    </code>
                  </div>
                )}

                {/* Filename */}
                {event.details.filename && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <File className="w-3 h-3" />
                    <span className="font-medium">File:</span>
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs truncate max-w-[200px]">
                      {event.details.filename}
                    </code>
                  </div>
                )}

                {/* File Size */}
                {event.details.fileSize && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Size:</span>
                    <span>{formatFileSize(event.details.fileSize)}</span>
                  </div>
                )}

                {/* Endpoint */}
                {event.details.endpoint && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Endpoint:</span>
                    <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">
                      {event.details.endpoint}
                    </code>
                  </div>
                )}
              </div>

              {/* User Agent */}
              {event.details.userAgent && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  <span className="font-medium">User Agent:</span>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs font-mono mt-1 break-all">
                    {event.details.userAgent}
                  </div>
                </div>
              )}

              {/* Reason */}
              {event.details.reason && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-medium">Reason:</span>{" "}
                  {event.details.reason}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>{" "}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
}
