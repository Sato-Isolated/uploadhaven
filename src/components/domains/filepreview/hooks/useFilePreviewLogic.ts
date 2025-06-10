"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useFilePreview } from "@/hooks/useFilePreview";
import { toast } from "sonner";
import type { FileMetadata } from "@/types";

export interface UseFilePreviewLogicReturn {
  // State
  fileInfo: FileMetadata | null;
  passwordRequired: boolean;
  password: string;
  passwordLoading: boolean;
  downloading: boolean;
  shortUrl: string;
  
  // TanStack Query states
  loading: boolean;
  error: Error | null;
  
  // Handlers
  handlePasswordSubmit: (e: React.FormEvent) => Promise<void>;
  handleDownload: () => Promise<void>;
  copyShareLink: () => void;
  setPassword: (password: string) => void;
  refetch: () => void;
  
  // Derived states
  isFileExpired: boolean;
}

export function useFilePreviewLogic(): UseFilePreviewLogicReturn {
  const params = useParams();
  const shortUrl = params.shortUrl as string;
  
  // Local state
  const [fileInfo, setFileInfo] = useState<FileMetadata | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // TanStack Query for file info
  const {
    data: response,
    isLoading: loading,
    error,
    refetch: fetchFileInfo,
  } = useFilePreview(shortUrl);

  // Handle the response data
  useEffect(() => {
    if (response?.success) {
      if (response.passwordRequired) {
        setPasswordRequired(true);
      } else {
        setFileInfo(response.fileInfo);
      }
    }
  }, [response]);

  // Password verification handler
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      setPasswordLoading(true);

      const response = await fetch(`/s/${shortUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.success) {
        setPasswordRequired(false);
        setFileInfo(result.fileInfo);
        toast.success("Password verified successfully!");
      } else {
        toast.error(result.error || "Invalid password");
      }    } catch {
      toast.error("Failed to verify password");
    } finally {
      setPasswordLoading(false);
    }
  }, [password, shortUrl]);

  // File download handler
  const handleDownload = useCallback(async () => {
    try {
      setDownloading(true);

      // Create download URL with verification if needed
      const downloadUrl = passwordRequired
        ? `/s/${shortUrl}?verified=${Date.now()}`
        : `/api/download/${shortUrl}`;

      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileInfo?.originalName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");    } catch {
      toast.error("Failed to start download");
    } finally {
      setDownloading(false);
    }
  }, [passwordRequired, shortUrl, fileInfo?.originalName]);

  // Share link copy handler
  const copyShareLink = useCallback(() => {
    const shareUrl = `${window.location.origin}/s/${shortUrl}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  }, [shortUrl]);

  // Derived state for file expiration
  const isFileExpired = fileInfo?.expiresAt ? new Date() > new Date(fileInfo.expiresAt) : false;

  return {
    // State
    fileInfo,
    passwordRequired,
    password,
    passwordLoading,
    downloading,
    shortUrl,
    
    // TanStack Query states
    loading,
    error,
    
    // Handlers
    handlePasswordSubmit,
    handleDownload,
    copyShareLink,
    setPassword,
    refetch: fetchFileInfo,
    
    // Derived states
    isFileExpired,
  };
}
