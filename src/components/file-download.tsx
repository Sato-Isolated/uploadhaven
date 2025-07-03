"use client";

import { useState, useEffect } from "react";
import { Download, Lock, AlertCircle, FileIcon, Clock, Eye, EyeOff } from "lucide-react";
import { ClientCryptoService } from "@/lib/client-crypto";
import { useFileInfo, useDownloadFile, usePrefetchFileInfo } from "@/hooks/use-api";
import { CryptoLoading, ProgressBar, LaserScanLoading } from "@/components/ui/loading";
import { HelpTooltip, InfoTooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";

interface FileDownloadProps {
  shareId: string;
}

export function FileDownload({ shareId }: FileDownloadProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [downloadStage, setDownloadStage] = useState<"decrypting" | "downloading" | "processing">("downloading");

  // React Query hooks
  const { data: fileInfo, isLoading: loading, error: queryError } = useFileInfo(shareId);
  const downloadMutation = useDownloadFile();
  const prefetchFileInfo = usePrefetchFileInfo();
  
  // Toast hook
  const { addToast } = useToast();

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
    setDownloadStage("downloading");

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
      
      setDownloadStage("decrypting");
      
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
      
      setDownloadStage("processing");
      
      const blob = new Blob([decryptedData], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Success toast
      addToast({
        type: "success",
        title: "Download Complete",
        message: `${result.fileName} has been downloaded successfully`
      });

      // React Query will automatically update the file info (download count)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Download failed. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Download Failed",
        message: errorMessage
      });
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
          <LaserScanLoading text="Scanning file data" className="mb-4" />
          <p className="text-muted-foreground">Retrieving file information...</p>
        </div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="tactical-card p-8">
        <div className="text-center">
          <div className="tactical-card p-4 border-destructive bg-destructive/10 error-shake">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Error
            </h2>
            <p className="text-muted-foreground">{displayError}</p>
          </div>
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
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Uploaded:
          </span>
          <span className="text-foreground font-tactical">
            {new Date(fileInfo.uploadedAt).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Expires:
          </span>
          <span className={`font-tactical ${new Date(fileInfo.expiresAt) < new Date() ? 'text-destructive' : 'text-foreground'}`}>
            {new Date(fileInfo.expiresAt).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Download className="w-3 h-3" />
            Downloads:
            {fileInfo.maxDownloads && (
              <InfoTooltip content="File will be deleted after reaching maximum downloads" />
            )}
          </span>
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
                <HelpTooltip
                  title="Password Protection"
                  description="This file is protected with a password. Enter the password provided by the uploader to download the file."
                />
              </label>
              <div className="flex items-center gap-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password to download"
                  className="flex-1 px-3 py-2 bg-input border border-border text-foreground placeholder-muted-foreground transition-all duration-200 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onKeyPress={(e) => e.key === "Enter" && downloadFile()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-tactical p-2"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {downloadMutation.isPending && (
            <div className="mb-4 text-center">
              <CryptoLoading stage={downloadStage} className="mb-4" />
              <div className="max-w-md mx-auto">
                <ProgressBar 
                  progress={downloadStage === "downloading" ? 33 : downloadStage === "decrypting" ? 66 : 90} 
                  variant="success"
                  showPercentage={false}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {downloadStage === "downloading" && "Downloading encrypted file from server..."}
                  {downloadStage === "decrypting" && "Decrypting file in your browser..."}
                  {downloadStage === "processing" && "Preparing file for download..."}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={downloadFile}
            disabled={downloadMutation.isPending || (requiresPassword && !password)}
            className="btn-tactical-primary w-full flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {downloadMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Processing...
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
