// Comprehensive Admin Types for UploadHaven

// Core admin statistics interface
export interface AdminStats {
  // File statistics
  totalFiles: number;
  totalStorage: string;
  totalStorageBytes: number;
  todayUploads: number;
  
  // User statistics
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  
  // System activity
  totalDownloads: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  uptime: string;
  
  // Security metrics
  securityEvents: number;
  blockedIPs: number;
  rateLimitHits: number;
}

// User management interface
export interface AdminUser {
  id: string;
  name?: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastActiveAt?: string;
  storageUsed: number;
  fileCount: number;
  planType?: 'free' | 'premium' | 'enterprise';
}

// File management interface
export interface AdminFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  expiresAt?: string;
  downloadCount: number;
  downloadLimit?: number;
  userId?: string;
  userName?: string;
  isAnonymous: boolean;
  isPasswordProtected: boolean;
  ipHash?: string;
}

// Activity tracking interface
export interface AdminActivity {
  id: string;
  type: 'upload' | 'download' | 'delete' | 'user_register' | 'user_login' | 'admin_action';
  description: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error';
}

// System health interface
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: string;
  services: {
    database: 'online' | 'offline' | 'degraded';
    storage: 'online' | 'offline' | 'degraded';
    api: 'online' | 'offline' | 'degraded';
    auth: 'online' | 'offline' | 'degraded';
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}

// Security metrics interface - Enhanced for Zero Knowledge compliance
export interface SecurityMetrics {
  status: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100 security score
  totalEvents: number;
  criticalEvents: number;
  blockedIPs: number;
  rateLimitHits: number;
  suspiciousActivity: number;
  issues: SecurityIssue[];
  recommendations: SecurityRecommendation[];
  threats: Record<string, { count: number; severity: string }>;
  trends: {
    scoreChange: number;
    issuesResolved: number;
    newThreats: number;
  };
  last24Hours: {
    events: number;
    blockedRequests: number;
    failedLogins: number;
    criticalEvents: number;
    suspiciousActivity: number;
  };
  zeroKnowledge: {
    totalFiles: number;
    encryptedFiles: number;
    encryptionRate: number; // percentage
    expiredFiles: number;
    complianceScore: number; // 0-100 Zero Knowledge compliance score
  };
  users: {
    total: number;
    verified: number;
    verificationRate: number; // percentage
    activeToday: number;
    riskScore: number; // 0-100 user security risk score
  };
}

// Security issue interface
export interface SecurityIssue {
  type: 'encryption' | 'cleanup' | 'verification' | 'attacks' | 'bruteforce';
  severity: 'low' | 'medium' | 'high';
  message: string;
  impact: string;
}

// Security recommendation interface
export interface SecurityRecommendation {
  action: 'enforceEncryption' | 'cleanupFiles' | 'improveVerification' | 'reviewThreats' | 'strengthenAuth';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// Quick actions interface
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void | Promise<void>;
  variant: 'default' | 'destructive' | 'secondary';
  requiresConfirmation?: boolean;
}

// Admin dashboard main props
export interface AdminBoardProps {
  className?: string;
}

// Admin data response interfaces
export interface AdminStatsResponse {
  stats: AdminStats;
  lastUpdated: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminFilesResponse {
  files: AdminFile[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminActivitiesResponse {
  activities: AdminActivity[];
  total: number;
  page: number;
  limit: number;
}

// Admin filter and sorting interfaces
export interface AdminFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  type?: string;
}

export interface AdminSorting {
  field: string;
  direction: 'asc' | 'desc';
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
}

// Admin operations interfaces
export interface BulkOperation {
  type: 'delete' | 'suspend' | 'activate' | 'export';
  items: string[];
  confirmation?: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: AdminFilters;
}

// Admin notification interface
export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
