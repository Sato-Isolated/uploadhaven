"use client";

import { useState } from "react";
import { Trash2, Download, Copy, X, Check, Square } from "lucide-react";
import { SerializedFile } from "@/domains/user/user-file-types";
import { useFileActions } from "@/hooks/use-user-files";

interface BulkActionsProps {
  selectedFiles: SerializedFile[];
  onClearSelection: () => void;
  onDeleteSelected: (fileIds: string[]) => void;
}

export function BulkActions({ selectedFiles, onClearSelection, onDeleteSelected }: BulkActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { copyShareLink } = useFileActions();

  if (selectedFiles.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const totalDownloads = selectedFiles.reduce((sum, file) => sum + file.downloadCount, 0);

  const handleBulkDelete = async () => {
    if (isDeleting) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFiles.length} file(s)? This action cannot be undone.`
    );
    
    if (confirmed) {
      setIsDeleting(true);
      try {
        const fileIds = selectedFiles.map(file => file.id);
        await onDeleteSelected(fileIds);
        onClearSelection();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleBulkCopyLinks = async () => {
    const links = selectedFiles.map(file => `${window.location.origin}/share/${file.id}`);
    const linksList = links.join('\n');
    
    try {
      await navigator.clipboard.writeText(linksList);
      copyShareLink(''); // Just trigger the success toast
    } catch {
      // Fallback: show links in a modal or alert
      const linkText = `Share links for ${selectedFiles.length} files:\n\n${linksList}`;
      window.alert(linkText);
    }
  };

  const handleBulkDownload = () => {
    // Open each file in a new tab for download
    selectedFiles.forEach((file, index) => {
      setTimeout(() => {
        window.open(`/share/${file.id}`, '_blank');
      }, index * 500); // Stagger downloads to avoid browser blocking
    });
  };

  return (
    <div className="tactical-card p-4 border-primary/20 bg-primary/5 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded border-2 border-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Total size: {formatFileSize(totalSize)} • Total downloads: {totalDownloads}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Actions */}
          <button
            onClick={handleBulkCopyLinks}
            className="btn-tactical-small flex items-center gap-2"
            title="Copy all share links"
          >
            <Copy className="w-4 h-4" />
            Copy Links
          </button>

          <button
            onClick={handleBulkDownload}
            className="btn-tactical-small flex items-center gap-2"
            title="Download all files"
          >
            <Download className="w-4 h-4" />
            Download All
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="btn-tactical-small flex items-center gap-2 text-destructive hover:text-destructive disabled:opacity-50"
            title="Delete selected files"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={onClearSelection}
            className="btn-tactical-small flex items-center gap-2 text-muted-foreground hover:text-foreground"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Preview des fichiers sélectionnés */}
      {selectedFiles.length <= 5 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Selected:</span>
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1 px-2 py-1 bg-secondary/50 rounded text-xs"
              >
                <span className="truncate max-w-32" title={file.originalName}>
                  {file.originalName}
                </span>
                <span className="text-muted-foreground">
                  ({formatFileSize(file.size)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedFiles.length > 5 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Selected files:</span>
            <div className="flex items-center gap-1">
              {selectedFiles.slice(0, 3).map((file) => (
                <div
                  key={file.id}
                  className="px-2 py-1 bg-secondary/50 rounded text-xs max-w-24 truncate"
                  title={file.originalName}
                >
                  {file.originalName}
                </div>
              ))}
              {selectedFiles.length > 3 && (
                <div className="px-2 py-1 bg-secondary/50 rounded text-xs text-muted-foreground">
                  +{selectedFiles.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
