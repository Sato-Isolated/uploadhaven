import { Badge } from '@/components/ui/badge';
import type { SecurityEvent } from '@/types';
import {
  getSeverityColor,
  getEventIcon,
  formatTimestamp,
} from '@/components/domains/security/panel/utils';
import { useTranslations } from 'next-intl';

interface SecurityEventsListContentProps {
  events: SecurityEvent[];
  filteredEvents: SecurityEvent[];
}

export function SecurityEventsListContent({
  events,
  filteredEvents,
}: SecurityEventsListContentProps) {
  const t = useTranslations('Security');
  const tCommon = useTranslations('Common');

  if (filteredEvents.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        {events.length === 0
          ? t('noSecurityEventsRecorded')
          : t('noEventsMatchFilters')}
      </div>
    );
  }

  return (
    <>
      {filteredEvents.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="mt-0.5">{getEventIcon(event.type)}</div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {typeof event.details === 'string'
                  ? event.details
                  : `${event.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} ${t('event')}`}
              </p>
              <Badge
                variant="outline"
                className={`text-xs ${getSeverityColor(event.severity)}`}
              >
                {event.severity}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(event.timestamp, t)}
            </p>
            {event.details &&
              typeof event.details === 'object' &&
              event.details.ip && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('ip')}: {event.details.ip}
                </p>
              )}
            {event.details &&
              typeof event.details === 'object' &&
              event.details.filename && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('file')}: {event.details.filename}
                </p>
              )}
            {event.details &&
              typeof event.details === 'object' &&
              event.details.fileSize && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('sizeLabel')}: {(event.details.fileSize / 1024 / 1024).toFixed(2)}
                  {tCommon('mb')}
                </p>
              )}
          </div>
        </div>
      ))}
    </>
  );
}
