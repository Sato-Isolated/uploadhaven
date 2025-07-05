"use client";

import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { SerializedFile } from "@/domains/user/user-file-types";

interface DeleteConfirmationProps {
  file: SerializedFile;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmation({ file, onConfirm, onCancel, isDeleting }: DeleteConfirmationProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="tactical-card p-6 max-w-md w-full mx-4 border-destructive/20 bg-background/95">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Delete File</h3>
            <p className="text-sm text-muted-foreground">This action cannot be undone</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Info */}
        <div className="tactical-card p-4 bg-secondary/30 mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📁</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate" title={file.originalName}>
                {file.originalName}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatFileSize(file.size)}</span>
                <span>{file.downloadCount} downloads</span>
                {file.maxDownloads && (
                  <span>Max: {file.maxDownloads}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="mb-6">
          <p className="text-sm text-foreground mb-2">
            Are you sure you want to delete this file? This will:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Permanently remove the file from storage</li>
            <li>• Invalidate all existing share links</li>
            <li>• Delete all associated download records</li>
            <li>• Cannot be recovered once deleted</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn-tactical-destructive flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete File
              </>
            )}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="btn-tactical flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-xs text-warning">
              <p className="font-medium mb-1">Important Note</p>
              <p>
                If this file has been shared, all recipients will lose access immediately. 
                Consider notifying them before deletion if necessary.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
