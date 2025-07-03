"use client";

import { useState, useCallback } from "react";
import { Upload, Lock, Clock, Download, Copy, Check, Eye, EyeOff } from "lucide-react";
import { ClientCryptoService } from "@/lib/client-crypto";
import { useUploadFile } from "@/hooks/use-api";
import { useCryptoWorker } from "@/hooks/use-crypto-worker";
import { performanceMonitor } from "@/lib/performance";

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

  // React Query hook for upload
  const uploadMutation = useUploadFile();
  
  // Crypto worker hook
  const { encryptFile: encryptFileWorker, isAvailable: isWorkerAvailable } = useCryptoWorker();

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
    }
  }, [enablePasswordProtection, generateRandomPassword, expirationHours, maxDownloads, uploadMutation, isWorkerAvailable, encryptFileWorker]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const copyToClipboard = async () => {
    if (uploadResult) {
      await navigator.clipboard.writeText(uploadResult.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyPasswordToClipboard = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
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
                ⚠️ Save this password! You'll need it to download the file.
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

      {/* Upload Area */}
      <div
        className={`drop-zone-tactical p-12 text-center ${
          dragActive ? "drag-over" : ""
        }`}
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
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              disabled={uploadMutation.isPending}
            />
          </label>
        </p>
        <p className="text-sm text-muted-foreground">
          Files are encrypted in your browser before upload
        </p>
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
            </label>
            <select
              value={expirationHours}
              onChange={(e) => setExpirationHours(Number(e.target.value))}
              className="w-full px-3 py-2 bg-input border border-border text-foreground"
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
            </label>
            <input
              type="number"
              value={maxDownloads || ""}
              onChange={(e) => setMaxDownloads(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Unlimited"
              min="1"
              className="w-full px-3 py-2 bg-input border border-border text-foreground placeholder-muted-foreground"
            />
          </div>
        </div>
      </div>

      {uploadMutation.isPending && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-primary">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Encrypting and uploading...
          </div>
        </div>
      )}

      {uploadMutation.error && (
        <div className="mt-8 text-center">
          <div className="text-destructive">
            Upload failed: {uploadMutation.error.message}
          </div>
        </div>
      )}
    </div>
  );
}
