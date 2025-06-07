// Types for Admin Analytics
export interface AdminAnalytics {
  success: boolean;
  timeRange: string;
  systemOverview: {
    totalFiles: number;
    totalUsers: number;
    totalStorage: string;
    totalStorageBytes: number;
    totalDownloads: number;
    filesLast24h: number;
    filesLast7d: number;
    usersLast24h: number;
    usersLast7d: number;
    activeUsers: number;
    fileGrowth: number;
    userGrowth: number;
  };
  fileAnalytics: {
    uploadTrends: Array<{
      date: string;
      count: number;
      totalSize: number;
    }>;
    fileTypeDistribution: Array<{
      type: string;
      count: number;
      size: string;
      sizeBytes: number;
    }>;
    topFiles: Array<{
      filename: string;
      originalName: string;
      downloadCount: number;
      size: string;
      sizeBytes: number;
      mimeType: string;
      uploadDate: string;
    }>;
  };
  userAnalytics: {
    growthTrends: Array<{
      date: string;
      count: number;
    }>;    storageByUser: Array<{
      userId: string;
      userName: string;
      totalSize: string;
      totalSizeBytes: number;
      fileCount: number;
    }>;
  };
  securityAnalytics: {
    eventsByType: Array<{
      _id: string;
      count: number;
    }>;
    recentEvents: Array<{
      type: string;
      timestamp: Date;
      details: string;
      userAgent?: string;
      ipAddress?: string;
    }>;
    totalEvents: number;
  };
}

export interface TrendData {
  trend: "up" | "down" | "neutral";
  percentage: number;
}

// Utility functions
export function getFileTypeIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎥";
  if (type.startsWith("audio/")) return "🎵";
  if (type === "application/pdf") return "📄";
  if (type.startsWith("text/")) return "📝";
  if (type.includes("zip") || type.includes("archive")) return "📦";
  if (type.includes("document") || type.includes("word")) return "📄";
  if (type.includes("spreadsheet") || type.includes("excel")) return "📊";
  return "📁";
}

export function calculateGrowthTrend(current: number, previous: number): TrendData {
  if (previous === 0) return { trend: "neutral", percentage: 0 };
  
  const change = ((current - previous) / previous) * 100;
  
  if (change > 5) return { trend: "up", percentage: Math.round(change) };
  if (change < -5) return { trend: "down", percentage: Math.round(Math.abs(change)) };
  return { trend: "neutral", percentage: Math.round(Math.abs(change)) };
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
