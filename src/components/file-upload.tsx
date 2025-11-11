"use client";

import { useState, useCallback } from "react";
import { Upload, Lock, Clock, Download, Copy, Check, Eye, EyeOff, FileIcon, AlertCircle, User, UserPlus, LogIn } from "lucide-react";
import { ClientCryptoService } from "@/lib/client-crypto";
import { useUploadFile } from "@/hooks/use-api";
import { useCryptoWorker } from "@/hooks/use-crypto-worker";
import { performanceMonitor } from "@/lib/performance";
import { useToast } from "@/components/ui/toast";
import { ProgressBar, CryptoLoading } from "@/components/ui/loading";
import { HelpTooltip, InfoTooltip } from "@/components/ui/tooltip";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

interface UploadResult {
  shareUrl: string;
  expiresAt: string;
}

export function FileUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [enablePasswordProtection, setEnablePasswordProtection] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [uploadStage, setUploadStage] = useState<"encrypting" | "uploading" | "processing">("encrypting");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Authentication
  const { data: session, isPending } = useSession();

  // React Query hook for upload
  const uploadMutation = useUploadFile();
  
  // Crypto worker hook
  const { encryptFile: encryptFileWorker, isAvailable: isWorkerAvailable } = useCryptoWorker();
  
  // Toast hook
  const { addToast } = useToast();

  // Generate random password
  const generateRandomPassword = useCallback(() => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setSelectedFile(file);
      setUploadStage("encrypting");
      
      // Generate password if protection is enabled
      let password = "";
      if (enablePasswordProtection) {
        password = generateRandomPassword();
        setGeneratedPassword(password);
      }

      // Get file buffer
      const fileBuffer = await file.arrayBuffer();
      let encryptionResult;

      if (isWorkerAvailable) {
        // Use Web Worker for encryption (non-blocking)
        encryptionResult = await performanceMonitor.measureCryptoOperation(
          'worker-encrypt',
          () => encryptFileWorker(fileBuffer, password)
        );
      } else {
        // Fallback to main thread encryption with performance monitoring
        encryptionResult = await performanceMonitor.measureCryptoOperation(
          'main-thread-encrypt',
          async () => {
            const cryptoService = new ClientCryptoService();
            const mainThreadResult = await cryptoService.encryptFile(fileBuffer, password);
            
            // Convert to worker format
            return {
              encryptedData: cryptoService.combineEncryptedData(
                mainThreadResult.encryptedData,
                mainThreadResult.iv,
                mainThreadResult.salt
              ),
              key: mainThreadResult.key,
            };
          }
        );
      }

      setUploadStage("uploading");

      // Create form data with encrypted file
      const formData = new FormData();
      const encryptedBlob = new Blob([encryptionResult.encryptedData], { type: 'application/octet-stream' });
      
      // Use browser's native MIME type detection, server will handle fallback with mime-types library
      const fileMimeType = file.type || 'application/octet-stream';
      
      formData.append("file", encryptedBlob, file.name);
      formData.append("originalName", file.name);
      formData.append("mimeType", fileMimeType);
      formData.append("size", file.size.toString());
      formData.append("expirationHours", expirationHours.toString());
      formData.append("passwordProtected", enablePasswordProtection ? "true" : "false");
      if (enablePasswordProtection && password) {
        formData.append("password", password);
      }
      if (maxDownloads) {
        formData.append("maxDownloads", maxDownloads.toString());
      }

      // Log form data for debugging
      console.log('FormData contents before upload:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      // Use React Query mutation for upload
      setUploadStage("processing");
      const result = await uploadMutation.mutateAsync(formData);
      
      // Add encryption key to share URL
      const urlWithKey = `${result.shareUrl}#key=${encryptionResult.key}`;
      
      setUploadResult({
        ...result,
        shareUrl: urlWithKey
      });
    } catch (error: unknown) {
      console.error("Upload error:", error);
      // Error is handled by React Query automatically
    } finally {
      setSelectedFile(null);
    }
  }, [enablePasswordProtection, generateRandomPassword, expirationHours, maxDownloads, uploadMutation, isWorkerAvailable, encryptFileWorker]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Add file size validation (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        addToast({
          type: "error",
          title: "File Too Large",
          message: "File size must be less than 50MB"
        });
        return;
      }
      handleFileUpload(file);
    }
  }, [handleFileUpload, addToast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Add file size validation
    if (file.size > 50 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "File Too Large",
        message: "File size must be less than 50MB"
      });
      return;
    }
    
    handleFileUpload(file);
  }, [handleFileUpload, addToast]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const copyToClipboard = async () => {
    if (uploadResult) {
      await navigator.clipboard.writeText(uploadResult.shareUrl);
      setCopied(true);
      addToast({
        type: "success",
        title: "Link Copied",
        message: "Share URL has been copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPasswordToClipboard = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      addToast({
        type: "success",
        title: "Password Copied",
        message: "Generated password has been copied to clipboard"
      });
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setGeneratedPassword("");
    setShowGeneratedPassword(false);
    setEnablePasswordProtection(false);
    setMaxDownloads(undefined);
    setCopied(false);
    setPasswordCopied(false);
    setSelectedFile(null);
  };

  if (uploadResult) {
    return (
      <div className="tactical-card p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary border border-success tactical-border flex items-center justify-center mx-auto mb-4 glow-primary">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Upload Successful
          </h2>
          <div className="text-muted-foreground text-sm mb-6">
            Your file has been encrypted and is ready to share.
          </div>

          {/* Generated Password Display */}
          {generatedPassword && (
            <div className="tactical-card p-4 mb-6 border-warning">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-warning">
                  Generated Password
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type={showGeneratedPassword ? "text" : "password"}
                  value={generatedPassword}
                  readOnly
                  className="flex-1 px-3 py-2 bg-input border border-border text-foreground text-sm font-tactical"
                />
                <button
                  onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                  className="btn-tactical"
                >
                  {showGeneratedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={copyPasswordToClipboard}
                  className="btn-tactical-primary"
                >
                  {passwordCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {passwordCopied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-warning mt-2">
                ⚠️ Save this password! You&apos;ll need it to download the file.
              </p>
            </div>
          )}

          <div className="tactical-card p-4 mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Share URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={uploadResult.shareUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-input border border-border text-foreground text-sm font-tactical"
              />
              <button
                onClick={copyToClipboard}
                className="btn-tactical-primary"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-6 space-y-2">
            <p className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Expires: {new Date(uploadResult.expiresAt).toLocaleString()}
            </p>
            {maxDownloads && (
              <p className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Max downloads: {maxDownloads}
              </p>
            )}
          </div>

          <button
            onClick={resetUpload}
            className="btn-tactical"
          >
            Upload Another File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tactical-card p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Upload & Share Files Securely
        </h2>
      </div>

      {/* Auth Status */}
      {!isPending && (
        <div className="mb-6">
          {session ? (
            <div className="tactical-card p-4 border-success bg-success/10">
              <div className="flex items-center justify-center gap-3 text-center">
                <div className="w-8 h-8 bg-success/20 border border-success rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-success font-medium text-sm">
                    Connected as {session.user.name || session.user.email}
                  </p>
                  <p className="text-success/70 text-xs">
                    Your files will be saved to your account for easy management
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="tactical-card p-4 border-primary bg-primary/10">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium">Create an account to manage your files</span>
                </div>
                <p className="text-primary/80 text-sm mb-4">
                  • View upload history • Manage your shares • Delete files anytime
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/auth/register"
                    className="btn-tactical-primary flex items-center gap-2 text-sm px-4 py-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>
                  <Link
                    href="/auth/login"
                    className="btn-tactical flex items-center gap-2 text-sm px-4 py-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  You can still upload files anonymously below
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`drop-zone-tactical p-12 text-center ${
          dragActive ? "drag-over" : ""
        } ${uploadMutation.isPending ? "pointer-events-none opacity-50" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">
          Drop your file here, or{" "}
          <label className="text-primary hover:text-hover-accent cursor-pointer">
            browse
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploadMutation.isPending}
            />
          </label>
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          Files are encrypted in your browser before upload
        </p>
        <p className="text-xs text-muted-foreground">
          Maximum file size: 50MB
        </p>
        
        {selectedFile && !uploadResult && (
          <div className="mt-4 p-3 bg-secondary/50 border border-border tactical-border slide-in-from-bottom">
            <div className="flex items-center gap-2 text-sm">
              <FileIcon className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">{selectedFile.name}</span>
              <span className="text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="mt-8 space-y-6">
        <div className="tactical-card p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enablePasswordProtection}
              onChange={(e) => setEnablePasswordProtection(e.target.checked)}
              className="h-4 w-4 accent-primary border-border focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Enable Password Protection
              </span>
              <HelpTooltip
                title="Password Protection"
                description="When enabled, a random password will be generated and required to download the file. This provides an additional layer of security."
              />
            </div>
          </label>
          <p className="text-xs text-muted-foreground mt-1 ml-7">
            A random password will be generated automatically after upload
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="tactical-card p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Clock className="w-4 h-4 text-warning" />
              Expiration Time
              <InfoTooltip content="Files will be automatically deleted after this time period" />
            </label>
            <select
              value={expirationHours}
              onChange={(e) => setExpirationHours(Number(e.target.value))}
              className="w-full px-3 py-2 bg-input border border-border text-foreground transition-all duration-200 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={24}>24 hours</option>
              <option value={72}>3 days</option>
              <option value={168}>1 week</option>
            </select>
          </div>

          <div className="tactical-card p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Download className="w-4 h-4 text-success" />
              Max Downloads (Optional)
              <InfoTooltip content="File will be deleted after reaching this download count" />
            </label>
            <input
              type="number"
              value={maxDownloads || ""}
              onChange={(e) => setMaxDownloads(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Unlimited"
              min="1"
              max="100"
              className="w-full px-3 py-2 bg-input border border-border text-foreground placeholder-muted-foreground transition-all duration-200 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {uploadMutation.isPending && (
        <div className="mt-8 text-center">
          <CryptoLoading stage={uploadStage} className="mb-4" />
          <div className="max-w-md mx-auto">
            <ProgressBar 
              progress={uploadStage === "encrypting" ? 33 : uploadStage === "uploading" ? 66 : 90} 
              variant="default"
              showPercentage={false}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {uploadStage === "encrypting" && "Encrypting file with zero-knowledge encryption..."}
              {uploadStage === "uploading" && "Uploading encrypted file to server..."}
              {uploadStage === "processing" && "Processing and generating share link..."}
            </p>
          </div>
        </div>
      )}

      {uploadMutation.error && (
        <div className="mt-8 text-center">
          <div className="tactical-card p-4 border-destructive bg-destructive/10 error-shake">
            <AlertCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
            <div className="text-destructive font-medium mb-1">Upload Failed</div>
            <div className="text-destructive/80 text-sm">
              {uploadMutation.error.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
