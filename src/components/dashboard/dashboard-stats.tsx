"use client";

import { Files, HardDrive, Download, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { UserFileStats } from "@/domains/user/user-file-types";

interface DashboardStatsProps {
  stats?: UserFileStats & {
    totalSizeFormatted: string;
    averageFileSizeFormatted: string;
    averageDownloadsPerFile: number;
  };
  isLoading: boolean;
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="tactical-card p-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-secondary rounded w-3/4"></div>
                <div className="h-6 bg-secondary rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="tactical-card p-6 text-center">
        <p className="text-muted-foreground">Unable to load statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      icon: Files,
      label: "Total Files",
      value: stats.totalFiles.toString(),
      subValue: `${stats.activeFiles} active`,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      icon: HardDrive,
      label: "Storage Used",
      value: stats.totalSizeFormatted,
      subValue: `Avg: ${stats.averageFileSizeFormatted}`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      icon: Download,
      label: "Total Downloads",
      value: stats.totalDownloads.toString(),
      subValue: `Avg: ${stats.averageDownloadsPerFile} per file`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      icon: stats.expiringFiles > 0 ? AlertTriangle : Clock,
      label: "Expiring Soon",
      value: stats.expiringFiles.toString(),
      subValue: `${stats.expiredFiles} expired`,
      color: stats.expiringFiles > 0 ? "text-warning" : "text-muted-foreground",
      bgColor: stats.expiringFiles > 0 ? "bg-warning/10" : "bg-secondary/10",
      borderColor: stats.expiringFiles > 0 ? "border-warning/20" : "border-border",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`tactical-card p-6 ${stat.borderColor} ${stat.bgColor} hover:scale-105 transition-transform duration-200`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.bgColor} ${stat.borderColor} border rounded-lg flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.subValue}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Fichier le plus téléchargé */}
      {stats.mostDownloadedFile && (
        <div className="md:col-span-2 lg:col-span-4">
          <div className="tactical-card p-6 border-success/20 bg-success/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 border border-success/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium">Most Downloaded File</p>
                <p className="text-lg font-bold text-success">{stats.mostDownloadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.mostDownloadedFile.downloads} downloads
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
