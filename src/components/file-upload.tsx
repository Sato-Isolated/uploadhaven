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
      formData.append("file", encryptedBlob, file.name);
      formData.append("originalName", file.name);
      formData.append("mimeType", file.type);
      formData.append("size", file.size.toString());
      formData.append("expirationHours", expirationHours.toString());
      formData.append("passwordProtected", enablePasswordProtection ? "true" : "false");
      if (enablePasswordProtection && password) {
        formData.append("password", password);
      }
      if (maxDownloads) {
        formData.append("maxDownloads", maxDownloads.toString());
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            File Uploaded Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your file has been encrypted and is ready to share.
          </p>

          {/* Generated Password Display */}
          {generatedPassword && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Generated Password (Required for Download)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type={showGeneratedPassword ? "text" : "password"}
                  value={generatedPassword}
                  readOnly
                  className="flex-1 px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md bg-yellow-100 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100 text-sm font-mono"
                />
                <button
                  onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                  className="px-3 py-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-md transition-colors"
                >
                  {showGeneratedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={copyPasswordToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  {passwordCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {passwordCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                ⚠️ Save this password! You&apos;ll need it to download the file. It cannot be recovered.
              </p>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Share URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={uploadResult.shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            <p className="flex items-center justify-center gap-2 mb-2">
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
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Upload Another File
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
        Upload & Share Files Securely
      </h2>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Drop your file here, or{" "}
          <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
            browse
            <input
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              disabled={uploadMutation.isPending}
            />
          </label>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Files are encrypted in your browser before upload
        </p>
      </div>

      {/* Options */}
      <div className="mt-8 space-y-6">
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enablePasswordProtection}
              onChange={(e) => setEnablePasswordProtection(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Password Protection
              </span>
            </div>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
            A random password will be generated automatically after upload
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="w-4 h-4" />
              Expiration Time
            </label>
            <select
              value={expirationHours}
              onChange={(e) => setExpirationHours(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={24}>24 hours</option>
              <option value={72}>3 days</option>
              <option value={168}>1 week</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Download className="w-4 h-4" />
              Max Downloads (Optional)
            </label>
            <input
              type="number"
              value={maxDownloads || ""}
              onChange={(e) => setMaxDownloads(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Unlimited"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {uploadMutation.isPending && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Encrypting and uploading...
          </div>
        </div>
      )}

      {uploadMutation.error && (
        <div className="mt-8 text-center">
          <div className="text-red-600 dark:text-red-400">
            Upload failed: {uploadMutation.error.message}
          </div>
        </div>
      )}
    </div>
  );
}
