"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileIcon, AlertCircle, Lock, Clock, Download } from "lucide-react";
import { useUploadFile } from "@/hooks/use-api";
import { useCryptoWorker } from "@/hooks/use-crypto-worker";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { ClientCryptoService } from "@/lib/client-crypto";
import { performanceMonitor } from "@/lib/performance";
import { ProgressBar, CryptoLoading } from "@/components/ui/loading";

interface DashboardUploadProps {
  onUploadComplete: () => void;
}

export function DashboardUpload({ onUploadComplete }: DashboardUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [enablePasswordProtection, setEnablePasswordProtection] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24);
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(undefined);
  const [uploadStage, setUploadStage] = useState<"encrypting" | "uploading" | "processing">("encrypting");

  const queryClient = useQueryClient();
  const uploadMutation = useUploadFile();
  const { encryptFile: encryptFileWorker, isAvailable: isWorkerAvailable } = useCryptoWorker();
  const { addToast } = useToast();

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 50 * 1024 * 1024) {
        addToast({
          type: "error",
          title: "File Too Large",
          message: "File size must be less than 50MB"
        });
        return;
      }
      setSelectedFile(file);
    }
  }, [addToast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "File Too Large",
        message: "File size must be less than 50MB"
      });
      return;
    }
    
    setSelectedFile(file);
  }, [addToast]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStage("encrypting");
      
      let password = "";
      if (enablePasswordProtection) {
        password = generateRandomPassword();
      }

      const fileBuffer = await selectedFile.arrayBuffer();
      let encryptionResult;

      if (isWorkerAvailable) {
        encryptionResult = await performanceMonitor.measureCryptoOperation(
          'worker-encrypt',
          () => encryptFileWorker(fileBuffer, password)
        );
      } else {
        encryptionResult = await performanceMonitor.measureCryptoOperation(
          'main-thread-encrypt',
          async () => {
            const cryptoService = new ClientCryptoService();
            const mainThreadResult = await cryptoService.encryptFile(fileBuffer, password);
            
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

      const formData = new FormData();
      const encryptedBlob = new Blob([encryptionResult.encryptedData], { type: 'application/octet-stream' });
      
      formData.append("file", encryptedBlob, selectedFile.name);
      formData.append("originalName", selectedFile.name);
      formData.append("mimeType", selectedFile.type || 'application/octet-stream');
      formData.append("size", selectedFile.size.toString());
      formData.append("expirationHours", expirationHours.toString());
      formData.append("passwordProtected", enablePasswordProtection ? "true" : "false");
      if (enablePasswordProtection && password) {
        formData.append("password", password);
      }
      if (maxDownloads) {
        formData.append("maxDownloads", maxDownloads.toString());
      }

      setUploadStage("processing");
      await uploadMutation.mutateAsync(formData);
      
      // Invalider les caches pour refresh les données
      queryClient.invalidateQueries({ queryKey: ['user-files'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      
      // Afficher le succès avec les détails
      addToast({
        type: "success",
        title: "Upload Successful",
        message: `${selectedFile.name} has been uploaded and is ready to share.`
      });

      // Si un mot de passe a été généré, l'afficher
      if (password) {
        addToast({
          type: "info",
          title: "Generated Password",
          message: `Password: ${password} - Save this securely!`
        });
      }

      // Reset et fermer
      setSelectedFile(null);
      setEnablePasswordProtection(false);
      setMaxDownloads(undefined);
      onUploadComplete();
      
    } catch (error) {
      console.error("Upload error:", error);
      // L'erreur est gérée par React Query automatiquement
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="tactical-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Quick Upload</h3>
        <button
          onClick={onUploadComplete}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {!selectedFile ? (
        <div
          className={`drop-zone-tactical p-8 text-center ${dragActive ? "drag-over" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-foreground font-medium mb-2">
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
          <p className="text-xs text-muted-foreground">Maximum file size: 50MB</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Fichier sélectionné */}
          <div className="tactical-card p-4 bg-secondary/30">
            <div className="flex items-center gap-3">
              <FileIcon className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePasswordProtection}
                  onChange={(e) => setEnablePasswordProtection(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Password Protection</span>
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-foreground mb-1">
                <Clock className="w-4 h-4 text-warning" />
                Expires in
              </label>
              <select
                value={expirationHours}
                onChange={(e) => setExpirationHours(Number(e.target.value))}
                className="w-full px-2 py-1 text-sm bg-input border border-border text-foreground"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>1 week</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-foreground mb-1">
                <Download className="w-4 h-4 text-success" />
                Max Downloads
              </label>
              <input
                type="number"
                value={maxDownloads || ""}
                onChange={(e) => setMaxDownloads(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Unlimited"
                min="1"
                max="100"
                className="w-full px-2 py-1 text-sm bg-input border border-border text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          {/* Bouton d'upload */}
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="btn-tactical-primary flex-1 flex items-center justify-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload File
                </>
              )}
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              disabled={uploadMutation.isPending}
              className="btn-tactical"
            >
              Cancel
            </button>
          </div>

          {/* Progress */}
          {uploadMutation.isPending && (
            <div className="space-y-2">
              <CryptoLoading stage={uploadStage} className="mb-2" />
              <ProgressBar 
                progress={uploadStage === "encrypting" ? 33 : uploadStage === "uploading" ? 66 : 90} 
                variant="default"
                showPercentage={false}
              />
              <p className="text-xs text-muted-foreground text-center">
                {uploadStage === "encrypting" && "Encrypting file..."}
                {uploadStage === "uploading" && "Uploading to server..."}
                {uploadStage === "processing" && "Processing and generating link..."}
              </p>
            </div>
          )}

          {/* Erreur */}
          {uploadMutation.error && (
            <div className="tactical-card p-3 border-destructive bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Upload Failed</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">
                {uploadMutation.error.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
