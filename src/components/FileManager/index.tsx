// index.tsx - Main FileManager orchestrating component

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
} from "lucide-react";
import FilePreview from "../FilePreview";
import LoadingIndicator from "./components/LoadingIndicator";
import EmptyState from "./components/EmptyState";
import FileListContainer from "./components/FileListContainer";
import type {
  FileInfo,
  FilePreviewData,
  ExpirationStatus,
  FileManagerProps,
} from "./types";

export default function FileManager({ className }: FileManagerProps = {}) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FilePreviewData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadFiles();
    // Refresh files every 30 seconds
    const interval = setInterval(loadFiles, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/files");
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }      const data = await response.json();
      setFiles(data.files || []);
    } catch {
      // Error loading files
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: FileInfo["type"]) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "video":
        return <Film className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "archive":
        return <Archive className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const copyLink = (filename: string) => {
    const url = `${window.location.origin}/api/files/${filename}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const downloadFile = (filename: string) => {
    const url = `${window.location.origin}/api/files/${filename}`;
    window.open(url, "_blank");
  };

  const deleteFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/files/${filename}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      // Remove from local state
      setFiles((prev) => prev.filter((file) => file.name !== filename));
      toast.success("File deleted successfully");
    } catch (error) {      // Error deleting file
      toast.error("Failed to delete file");
    }
  };

  const getExpirationStatus = (expiresAt?: string | null): ExpirationStatus => {
    if (!expiresAt) {
      return {
        text: "Never expires",
        variant: "secondary" as const,
        expired: false,
        isExpiringSoon: false,
        timeLeft: "",
      };
    }

    const now = new Date();
    const expiration = new Date(expiresAt);
    const timeLeft = expiration.getTime() - now.getTime();

    if (timeLeft <= 0) {
      return {
        text: "Expired",
        variant: "destructive" as const,
        expired: true,
        isExpiringSoon: false,
        timeLeft: "",
      };
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return {
        text: `Expires in ${days} day${days > 1 ? "s" : ""}`,
        variant: days <= 1 ? ("destructive" as const) : ("secondary" as const),
        expired: false,
        isExpiringSoon: days <= 1,
        timeLeft: `${days} day${days > 1 ? "s" : ""}`,
      };
    } else if (hours > 0) {
      return {
        text: `Expires in ${hours} hour${hours > 1 ? "s" : ""}`,
        variant: hours <= 2 ? ("destructive" as const) : ("secondary" as const),
        expired: false,
        isExpiringSoon: hours <= 2,
        timeLeft: `${hours} hour${hours > 1 ? "s" : ""}`,
      };
    } else {
      const minutes = Math.floor(timeLeft / (1000 * 60));
      return {
        text: `Expires in ${minutes} min${minutes > 1 ? "s" : ""}`,
        variant: "destructive" as const,
        expired: false,
        isExpiringSoon: true,
        timeLeft: `${minutes} min${minutes > 1 ? "s" : ""}`,
      };
    }
  };

  const openPreview = (file: FileInfo) => {
    setPreviewFile({
      filename: file.name,
      originalName: file.originalName,
      type: file.mimeType,
      size: file.size,
      url: `${window.location.origin}/api/files/${file.name}`,
    });
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  if (loading) {
    return <LoadingIndicator />;
  }
  if (files.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={className}>
      <FileListContainer
        files={files}
        onPreview={openPreview}
        onCopyLink={copyLink}
        onDownload={downloadFile}
        onDelete={deleteFile}
        getExpirationStatus={getExpirationStatus}
        getFileIcon={getFileIcon}
      />

      <FilePreview
        isOpen={isPreviewOpen}
        onClose={closePreview}
        file={previewFile}
      />
    </div>
  );
}
