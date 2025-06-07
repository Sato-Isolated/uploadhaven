export interface ActivityEvent {
  _id: string;
  type:
    | "upload"
    | "download"
    | "user_registered"
    | "user_login"
    | "file_deleted"
    | "security_event";
  timestamp: string;
  userId?: string;
  userName?: string;
  fileId?: string;
  fileName?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  severity?: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
}

export interface SecurityStats {
  totalEvents: number;
  rateLimitHits: number;
  invalidFiles: number;
  blockedIPs: number;
  last24h: number;
  malwareDetected: number;
  largeSizeBlocked: number;
}

export interface User {
  _id: string;
  name?: string;
  email: string;
  role?: string;
  createdAt: string;
  emailVerified?: boolean;
  isActive?: boolean;
}

export interface FileData {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  expiresAt: string | null;
  downloadCount: number;
  type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  userId?: string;
  userName?: string;
  isAnonymous: boolean;
}

export interface AdminDashboardProps {
  stats: {
    totalFiles: number;
    totalUsers: number;
    totalStorage: string;
    todayUploads: number;
    activeUsers: number;
    securityEvents: number;
  };
}

export interface AdminDashboardState {
  recentActivities: ActivityEvent[];
  activitiesLoading: boolean;
  securityStats: SecurityStats;
  securityLoading: boolean;
  users: User[];
  files: FileData[];
  usersLoading: boolean;
  filesLoading: boolean;
  showUsersModal: boolean;
  showFilesModal: boolean;
  showSecurityModal: boolean;
  showLogsModal: boolean;
}
