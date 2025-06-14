import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, X, Clock, Globe, File } from 'lucide-react';
import type { SecurityEvent, BaseComponentProps } from '@/types';
import { formatTimestamp } from '../utils';
import { useTranslations } from 'next-intl';

interface SecurityAlertProps extends BaseComponentProps {
  event: SecurityEvent;
  onDismiss: () => void;
}

function formatFileSize(bytes?: number, t?: (key: string) => string): string {
  if (!bytes) return t?.('unknown') || 'Unknown';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

function getEventTypeDisplay(type: string, t: (key: string) => string): { label: string; color: string } {
  const types = {
    rate_limit: {
      label: t('rateLimitExceeded'),
      color:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    },
    invalid_file: {
      label: t('invalidFileType'),
      color:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    },
    blocked_ip: {
      label: t('ipBlocked'),
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    },
    malware_detected: {
      label: t('malwareDetected'),
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    },
    large_file: {
      label: t('fileTooLarge'),
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
    access_denied: {
      label: t('accessDenied'),
      color:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    },
    suspicious_activity: {
      label: t('suspiciousActivity'),
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    },
    system_maintenance: {
      label: t('systemMaintenance'),
      color:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
  };
  return (
    types[type as keyof typeof types] || {
      label: type,
      color: 'bg-gray-100 text-gray-800',
    }
  );
}

export default function SecurityAlert({
  event,
  onDismiss,
}: SecurityAlertProps) {
  const t = useTranslations('Security');
  const tAdmin = useTranslations('Admin');
  
  const isHighPriority =
    event.severity === 'critical' || event.severity === 'high';

  if (!isHighPriority) {
    return null;
  }

  const eventTypeInfo = getEventTypeDisplay(event.type, t);

  return (
    <Alert
      className={`mb-4 ${
        event.severity === 'critical'
          ? 'border-red-500 bg-red-50 dark:bg-red-950'
          : 'border-orange-500 bg-orange-50 dark:bg-orange-950'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {event.severity === 'critical' ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <Shield className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-400" />
          )}
          <div className="flex-1">
            <AlertTitle className="mb-2 flex flex-wrap items-center gap-2">
              {event.severity === 'critical'
                ? t('criticalSecurityAlert')
                : t('highPriorityAlert')}
              <Badge
                variant="outline"
                className={
                  event.severity === 'critical'
                    ? 'border-red-300 bg-red-100 text-red-600 dark:border-red-800 dark:bg-red-900 dark:text-red-400'
                    : 'border-orange-300 bg-orange-100 text-orange-600 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-400'
                }
              >
                {event.severity?.toUpperCase() || t('unknownSeverity')}
              </Badge>
              <Badge className={eventTypeInfo.color}>
                {eventTypeInfo.label}
              </Badge>
            </AlertTitle>

            <AlertDescription className="space-y-2 text-sm">
              <div className="mb-3">
                <strong className="text-base">
                  {typeof event.details === 'string'
                    ? event.details
                    : event.details?.reason || t('securityEventDetected')}
                </strong>
              </div>
              {/* Informations de base */}
              <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                {/* Timestamp */}
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span className="font-medium">{t('time')}:</span>
                  <span>{formatTimestamp(event.timestamp, t)}</span>
                </div>

                {/* IP Address */}
                {((typeof event.details === 'object' && event.details?.ip) ||
                  event.ip) && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Globe className="h-3 w-3" />
                    <span className="font-medium">{t('ip')}:</span>
                    <code className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800">
                      {(typeof event.details === 'object' &&
                        event.details?.ip) ||
                        event.ip}
                    </code>
                  </div>
                )}

                {/* Filename */}
                {typeof event.details === 'object' &&
                  event.details?.filename && (
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <File className="h-3 w-3" />
                      <span className="font-medium">{t('file')}:</span>
                      <code className="max-w-[200px] truncate rounded bg-gray-100 px-1 text-xs dark:bg-gray-800">
                        {event.details.filename}
                      </code>
                    </div>
                  )}

                {/* File Size */}
                {typeof event.details === 'object' &&
                  event.details?.fileSize && (
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{t('sizeLabel')}:</span>
                      <span>{formatFileSize(event.details.fileSize, tAdmin)}</span>
                    </div>
                  )}

                {/* Endpoint */}
                {typeof event.details === 'object' &&
                  event.details?.endpoint && (
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{t('endpoint')}:</span>
                      <code className="rounded bg-gray-100 px-1 text-xs dark:bg-gray-800">
                        {event.details.endpoint}
                      </code>
                    </div>
                  )}
              </div>
              {/* User Agent */}
              {typeof event.details === 'object' &&
                event.details?.userAgent && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{t('userAgent')}:</span>
                    <div className="mt-1 rounded bg-gray-50 p-2 font-mono text-xs break-all dark:bg-gray-800">
                      {event.details.userAgent}
                    </div>
                  </div>
                )}
              {/* Reason */}
              {typeof event.details === 'object' && event.details?.reason && (
                <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <span className="font-medium">{t('reason')}:</span>
                  {event.details.reason}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
