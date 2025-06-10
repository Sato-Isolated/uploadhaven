import { Badge } from "@/components/ui/badge";
import type { SecurityEvent } from "@/types";
import { getSeverityColor, getEventIcon, formatTimestamp } from "@/components/domains/security/panel/utils";

interface SecurityEventsListContentProps {
  events: SecurityEvent[];
  filteredEvents: SecurityEvent[];
}

export function SecurityEventsListContent({
  events,
  filteredEvents,
}: SecurityEventsListContentProps) {
  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {events.length === 0
          ? "No security events recorded"
          : "No events match the current filters"}
      </div>
    );
  }

  return (
    <>
      {filteredEvents.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="mt-0.5">{getEventIcon(event.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {typeof event.details === 'string' 
                  ? event.details 
                  : `${event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Event`}
              </p>
              <Badge
                variant="outline"
                className={`text-xs ${getSeverityColor(event.severity)}`}
              >
                {event.severity}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(event.timestamp)}
            </p>
            {event.details && typeof event.details === 'object' && event.details.ip && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                IP: {event.details.ip}
              </p>
            )}
            {event.details && typeof event.details === 'object' && event.details.filename && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                File: {event.details.filename}
              </p>
            )}
            {event.details && typeof event.details === 'object' && event.details.fileSize && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Size: {(event.details.fileSize / 1024 / 1024).toFixed(2)}
                MB
              </p>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
