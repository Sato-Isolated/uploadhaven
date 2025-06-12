export const getActivityColor = (type: string): string => {
  switch (type) {
    case 'upload':
    case 'file_upload':
      return 'bg-green-500';
    case 'download':
    case 'file_download':
      return 'bg-blue-500';
    case 'user_registered':
    case 'user_registration':
    case 'user_login':
    case 'user_logout':
      return 'bg-purple-500';
    case 'file_deleted':
      return 'bg-yellow-500';
    case 'security_event':
    case 'malware_detected':
    case 'suspicious_activity':
      return 'bg-red-500';
    default:
      return 'bg-orange-500';
  }
};

export const formatActivityType = (type: string): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const defaultSecurityStats = {
  totalEvents: 0,
  rateLimitHits: 0,
  invalidFiles: 0,
  blockedIPs: 0,
  last24h: 0,
  malwareDetected: 0,
  largeSizeBlocked: 0,
};
