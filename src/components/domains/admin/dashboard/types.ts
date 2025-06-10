// Import centralized types for admin dashboard
import type {
  ActivityEvent,
  SecurityStats,
  BaseComponentProps,
} from "@/types";

// Re-export for component usage
export type { SecurityStats };

// Admin-specific User interface
export interface User {
  _id: string;
  name?: string;
  email: string;
  role?: string;
  createdAt: string;
  emailVerified?: boolean;
  isActive?: boolean;
}

// Admin-specific FileData interface
export interface FileData {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  expiresAt: string | null;
  downloadCount: number;
  type: "image" | "video" | "audio" | "document" | "archive" | "other";
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
  showSecurityModal: boolean;
  showLogsModal: boolean;
}
