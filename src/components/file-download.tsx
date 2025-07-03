"use client";

import { useState, useEffect } from "react";
import { Download, Lock, AlertCircle, FileIcon } from "lucide-react";
import { ClientCryptoService } from "@/lib/client-crypto";
import { useFileInfo, useDownloadFile, usePrefetchFileInfo } from "@/hooks/use-api";

interface FileDownloadProps {
  shareId: string;
}

export function FileDownload({ shareId }: FileDownloadProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // React Query hooks
  const { data: fileInfo, isLoading: loading, error: queryError } = useFileInfo(shareId);
  const downloadMutation = useDownloadFile();
  const prefetchFileInfo = usePrefetchFileInfo();

  // Prefetch file info on component mount for better UX
  useEffect(() => {
    prefetchFileInfo(shareId);
  }, [shareId, prefetchFileInfo]);

  // Detect query errors
  const displayError = error || (queryError ? queryError.message : null);
  const requiresPassword = fileInfo?.passwordProtected || false;


  const downloadFile = async () => {
    if (!fileInfo) return;

    setError(null);

    try {
      // Extract encryption key from URL fragment
      const urlFragment = window.location.hash;
      const keyMatch = urlFragment.match(/key=([^&]+)/);
      const encryptionKey = keyMatch ? keyMatch[1] : null;

      if (!encryptionKey && !requiresPassword) {
        setError("Encryption key not found in URL");
        return;
      }

      // Use React Query mutation for download
      const result = await downloadMutation.mutateAsync({ 
        fileId: fileInfo.id, 
        password: requiresPassword ? password : undefined,
        shareId: shareId // Pass shareId to enable access counting
      });
      
      // Convert base64 back to ArrayBuffer
      const binaryString = atob(result.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const encryptedBuffer = bytes.buffer;

      // Decrypt file on client side
      const cryptoService = new ClientCryptoService();
      const { encryptedData, iv, salt } = cryptoService.separateEncryptedData(encryptedBuffer);
      
      const decryptedData = await cryptoService.decryptFile(
        { encryptedData, iv, salt, key: encryptionKey || '' },
        password || undefined
      );
      
      const blob = new Blob([decryptedData], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // React Query will automatically update the file info (download count)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Download failed. Please try again.");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="tactical-card p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading file information...</p>
        </div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="tactical-card p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Error
          </h2>
          <p className="text-muted-foreground">{displayError}</p>
        </div>
      </div>
    );
  }

  if (!fileInfo) {
    return (
      <div className="tactical-card p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            File Not Found
          </h2>
          <p className="text-muted-foreground">
            The file you&apos;re looking for doesn&apos;t exist or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tactical-card p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-secondary border border-primary tactical-border flex items-center justify-center mx-auto mb-4 glow-primary">
          <FileIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {fileInfo.originalName}
        </h2>
        <p className="text-muted-foreground">
          {formatFileSize(fileInfo.size)}
        </p>
      </div>

      <div className="tactical-card p-4 mb-6 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Uploaded:</span>
          <span className="text-foreground font-tactical">
            {new Date(fileInfo.uploadedAt).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Expires:</span>
          <span className="text-foreground font-tactical">
            {new Date(fileInfo.expiresAt).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Downloads:</span>
          <span className="text-foreground font-tactical">
            {fileInfo.downloadCount}
            {fileInfo.maxDownloads ? ` / ${fileInfo.maxDownloads}` : ""}
          </span>
        </div>
      </div>

      {!fileInfo.canBeDownloaded ? (
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium">
            This file is no longer available for download
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            {new Date(fileInfo.expiresAt) < new Date() 
              ? "File has expired" 
              : fileInfo.shareInfo?.isExpired
              ? "Share link has expired"
              : !fileInfo.shareInfo?.canBeAccessed
              ? "Share access limit reached"
              : "Maximum downloads reached"}
          </p>
          {fileInfo.shareInfo?.maxAccess && (
            <p className="text-muted-foreground text-xs mt-1">
              Access count: {fileInfo.shareInfo.accessCount} / {fileInfo.shareInfo.maxAccess}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requiresPassword && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Lock className="w-4 h-4 text-warning" />
                Password Required
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to download"
                className="w-full px-3 py-2 bg-input border border-border text-foreground placeholder-muted-foreground"
                onKeyPress={(e) => e.key === "Enter" && downloadFile()}
              />
            </div>
          )}

          <button
            onClick={downloadFile}
            disabled={downloadMutation.isPending || (requiresPassword && !password)}
            className="btn-tactical-primary w-full flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloadMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download File
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            File will be decrypted in your browser before download
          </p>
        </div>
      )}
    </div>
  );
}
