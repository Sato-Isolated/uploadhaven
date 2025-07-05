"use client";

import { useState } from "react";
import { 
  Copy, 
  Trash2, 
  Clock, 
  AlertTriangle,
  Lock,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { SerializedFile } from "@/domains/user/user-file-types";
import { FilePreview } from "./file-preview";

interface FileCardProps {
  file: SerializedFile;
  onDelete: () => void;
  onCopyLink: (url: string) => void;
}

export function FileCard({ file, onDelete, onCopyLink }: FileCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.startsWith('text/')) return '📝';
    return '📁';
  };

  const getStatusInfo = () => {
    const now = new Date();
    const expiresAt = new Date(file.expiresAt);
    const isExpired = expiresAt <= now;
    const isExpiringSoon = !isExpired && (expiresAt.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;

    if (isExpired) {
      return {
        status: 'expired',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        icon: AlertTriangle,
        text: 'Expired'
      };
    }

    if (isExpiringSoon) {
      return {
        status: 'expiring',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/20',
        icon: Clock,
        text: 'Expiring Soon'
      };
    }

    return {
      status: 'active',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      icon: Eye,
      text: 'Active'
    };
  };

  const statusInfo = getStatusInfo();
  const downloadProgress = file.maxDownloads 
    ? Math.round((file.downloadCount / file.maxDownloads) * 100)
    : 0;

  // Construire l'URL de partage (simplifié pour l'exemple)
  const shareUrl = `/share/${file.id}`;

  return (
    <div className={`tactical-card p-4 hover:scale-105 transition-all duration-200 ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
      {/* Header avec icône et actions */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate" title={file.originalName}>
              {file.originalName}
            </h4>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-6 z-10 tactical-card p-2 min-w-[150px] shadow-lg slide-in-from-top">
              <button
                onClick={() => {
                  onCopyLink(shareUrl);
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1 text-sm text-foreground hover:bg-secondary"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
              <button
                onClick={() => {
                  setShowPreview(true);
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1 text-sm text-foreground hover:bg-secondary"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => {
                  window.open(shareUrl, '_blank');
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1 text-sm text-foreground hover:bg-secondary"
              >
                <Eye className="w-4 h-4" />
                View Share
              </button>
              <hr className="my-1 border-border" />
              <button
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statut */}
      <div className="flex items-center gap-2 mb-3">
        <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
        <span className={`text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
        {file.passwordHash && (
          <div title="Password Protected">
            <Lock className="w-4 h-4 text-warning" />
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Uploaded:</span>
          <span>{formatDate(file.uploadedAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Expires:</span>
          <span>{formatDate(file.expiresAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Downloads:</span>
          <span>
            {file.downloadCount}
            {file.maxDownloads && ` / ${file.maxDownloads}`}
          </span>
        </div>
      </div>

      {/* Barre de progression des téléchargements */}
      {file.maxDownloads && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Download Progress</span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                downloadProgress >= 90 ? 'bg-destructive' :
                downloadProgress >= 70 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onCopyLink(shareUrl)}
          className="btn-tactical-small flex-1 flex items-center justify-center gap-1"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
        <button
          onClick={() => window.open(shareUrl, '_blank')}
          className="btn-tactical-small flex-1 flex items-center justify-center gap-1"
        >
          <Eye className="w-3 h-3" />
          View
        </button>
      </div>

      {/* Clic en dehors pour fermer le menu */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}

      {/* Modal de prévisualisation */}
      <FilePreview
        file={file}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onDownload={() => window.open(shareUrl, '_blank')}
      />
    </div>
  );
}
