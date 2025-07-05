"use client";

import { useState } from "react";
import { X, Download, ExternalLink, Eye, FileIcon } from "lucide-react";
import { SerializedFile } from "@/domains/user/user-file-types";

interface FilePreviewProps {
  file: SerializedFile;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

export function FilePreview({ file, isOpen, onClose, onDownload }: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  if (!isOpen) return null;

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isImage = file.mimeType.startsWith('image/');
  const isPDF = file.mimeType === 'application/pdf';
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');
  const isText = file.mimeType.startsWith('text/');

  const canPreview = isImage || isPDF || isVideo || isAudio || isText;
  const shareUrl = `/share/${file.id}`;

  const renderPreviewContent = () => {
    if (!canPreview) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FileIcon className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">Preview not available</p>
          <p className="text-sm">This file type cannot be previewed</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FileIcon className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">Failed to load preview</p>
          <p className="text-sm">Try downloading the file instead</p>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center bg-secondary/20 rounded-lg overflow-hidden">
          <img
            src={shareUrl}
            alt={file.originalName}
            className="max-w-full max-h-96 object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="bg-secondary/20 rounded-lg overflow-hidden h-96">
          <iframe
            src={`${shareUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0"
            title={file.originalName}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="bg-secondary/20 rounded-lg overflow-hidden">
          <video
            controls
            className="w-full max-h-96"
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          >
            <source src={shareUrl} type={file.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center justify-center h-32 bg-secondary/20 rounded-lg">
          <audio
            controls
            className="w-full max-w-md"
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          >
            <source src={shareUrl} type={file.mimeType} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileIcon className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Preview not supported</p>
        <p className="text-sm">Download the file to view its contents</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="tactical-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate mb-1">
              {file.originalName}
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{formatFileSize(file.size)}</span>
              <span>{file.mimeType}</span>
              <span>Uploaded {formatDate(file.uploadedAt)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {onDownload && (
              <button
                onClick={onDownload}
                className="btn-tactical flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
            
            <button
              onClick={() => window.open(shareUrl, '_blank')}
              className="btn-tactical flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </button>
            
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading && canPreview && (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading preview...</p>
              </div>
            </div>
          )}
          
          {(!isLoading || !canPreview) && renderPreviewContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-secondary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Downloads:</span>
              <span className="ml-2 font-medium text-foreground">
                {file.downloadCount}
                {file.maxDownloads && ` / ${file.maxDownloads}`}
              </span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Expires:</span>
              <span className="ml-2 font-medium text-foreground">
                {formatDate(file.expiresAt)}
              </span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Protection:</span>
              <span className="ml-2 font-medium text-foreground">
                {file.passwordHash ? 'Password Protected' : 'Public'}
              </span>
            </div>
            
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 font-medium text-success">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
