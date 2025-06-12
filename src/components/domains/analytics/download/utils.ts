// Utility functions and types for DownloadAnalytics components

export interface DownloadAnalytics {
  totalDownloads: number;
  last24hDownloads: number;
  last7dDownloads: number;
  topFiles: Array<{
    filename: string;
    originalName: string;
    downloadCount: number;
    size: number;
    type: string;
    uploadDate: string;
  }>;
  downloadTrends: Array<{
    date: string;
    downloads: number;
  }>;
}

export interface DownloadAnalyticsProps {
  className?: string;
}

export interface TrendData {
  trend: 'up' | 'down' | 'neutral';
  percentage: number;
}

// Get appropriate file type icon/emoji for display
export function getFileTypeIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.startsWith('audio/')) return '🎵';
  if (type === 'application/pdf') return '📄';
  if (type.startsWith('text/')) return '📝';
  return '📁';
}

// Calculate trend percentage and direction based on download data
export function calculateTrend(analytics: DownloadAnalytics | null): TrendData {
  if (!analytics) return { trend: 'neutral', percentage: 0 };

  const { last24hDownloads, last7dDownloads } = analytics;
  const avgDaily7d = last7dDownloads / 7;

  if (avgDaily7d === 0) return { trend: 'neutral', percentage: 0 };

  const change = ((last24hDownloads - avgDaily7d) / avgDaily7d) * 100;

  if (change > 10) return { trend: 'up', percentage: Math.round(change) };
  if (change < -10)
    return { trend: 'down', percentage: Math.round(Math.abs(change)) };
  return { trend: 'neutral', percentage: Math.round(Math.abs(change)) };
}

// Format date for display in trends
export function formatTrendDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}
