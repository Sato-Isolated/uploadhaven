"use client";

import { useState, useEffect } from "react";
import { X, Download, Eye, EyeOff, AlertTriangle, FileIcon, Shield, Info } from "lucide-react";
import { ClientCryptoService } from "@/lib/client-crypto";

interface FileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  expiresAt: string;
  passwordProtected?: boolean;
}

interface SecureFilePreviewProps {
  shareId: string;
  fileInfo: FileInfo;
  encryptedContent: string;
  password?: string;
  onClose: () => void;
  onDownload?: () => void;
}

// MIME types allowed for preview
const PREVIEW_ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg',
  'text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript'
];

// Sensitive types that require extra warning
const SENSITIVE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/ogg'
];

export function SecureFilePreview({ 
  shareId, 
  fileInfo, 
  encryptedContent, 
  password, 
  onClose, 
  onDownload 
}: SecureFilePreviewProps) {
  const [showWarning, setShowWarning] = useState(true);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasConsentLogged, setHasConsentLogged] = useState(false);

  const canPreview = PREVIEW_ALLOWED_TYPES.includes(fileInfo.mimeType);
  const isSensitive = SENSITIVE_TYPES.includes(fileInfo.mimeType);
  
  const getContentTypeLabel = () => {
    if (fileInfo.mimeType.startsWith('image/')) return 'Image Content';
    if (fileInfo.mimeType.startsWith('video/')) return 'Media Content';
    if (fileInfo.mimeType.startsWith('audio/')) return 'Audio Content';
    if (fileInfo.mimeType === 'application/pdf') return 'Document Content';
    if (fileInfo.mimeType.startsWith('text/')) return 'Text Content';
    return 'File Content';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Log preview consent
  const logPreviewConsent = async () => {
    if (hasConsentLogged) return;
    
    try {
      await fetch('/api/audit/preview-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileInfo.id,
          shareId,
          mimeType: fileInfo.mimeType,
          fileName: fileInfo.originalName
        }),
      });
      setHasConsentLogged(true);
    } catch (error) {
      console.error('Failed to log preview consent:', error);
      // Continue anyway - don't block preview for logging failure
    }
  };

  // Decrypt and prepare content for preview
  const handleShowPreview = async () => {
    if (!canPreview) {
      setError('This file type cannot be previewed');
      return;
    }

    setIsDecrypting(true);
    setError(null);

    try {
      // Log consent first
      await logPreviewConsent();

      // Extract encryption key from URL fragment
      const urlFragment = window.location.hash;
      const keyMatch = urlFragment.match(/key=([^&]+)/);
      const encryptionKey = keyMatch ? keyMatch[1] : null;

      if (!encryptionKey && !fileInfo.passwordProtected) {
        throw new Error('Encryption key not found in URL');
      }

      // Convert base64 back to ArrayBuffer
      const binaryString = atob(encryptedContent);
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
        password
      );

      const blob = new Blob([decryptedData], { type: fileInfo.mimeType });
      setDecryptedContent(blob);
      
      // Create preview URL
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      setShowWarning(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to decrypt file for preview';
      setError(errorMessage);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const renderPreviewContent = () => {
    if (!previewUrl || !decryptedContent) return null;

    if (fileInfo.mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-secondary/20 rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt={fileInfo.originalName}
            className="max-w-full max-h-96 object-contain"
            onError={() => setError('Failed to load image preview')}
          />
        </div>
      );
    }

    if (fileInfo.mimeType === 'application/pdf') {
      return (
        <div className="bg-secondary/20 rounded-lg overflow-hidden h-96">
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-0"
            title={fileInfo.originalName}
            onError={() => setError('Failed to load PDF preview')}
          />
        </div>
      );
    }

    if (fileInfo.mimeType.startsWith('video/')) {
      return (
        <div className="bg-secondary/20 rounded-lg overflow-hidden">
          <video
            controls
            className="w-full max-h-96"
            onError={() => setError('Failed to load video preview')}
          >
            <source src={previewUrl} type={fileInfo.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (fileInfo.mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-32 bg-secondary/20 rounded-lg">
          <audio
            controls
            className="w-full max-w-md"
            onError={() => setError('Failed to load audio preview')}
          >
            <source src={previewUrl} type={fileInfo.mimeType} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (fileInfo.mimeType.startsWith('text/')) {
      return (
        <div className="bg-secondary/20 rounded-lg p-4 h-96 overflow-auto">
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title={fileInfo.originalName}
            onError={() => setError('Failed to load text preview')}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileIcon className="w-16 h-16 mb-4" />
        <p className="text-lg font-medium">Preview not supported</p>
        <p className="text-sm">Download the file to view its contents</p>
      </div>
    );
  };

  if (!canPreview) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="tactical-card w-full max-w-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Preview Not Available</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center py-8">
            <FileIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Preview not supported</p>
            <p className="text-muted-foreground mb-4">
              This file type ({fileInfo.mimeType}) cannot be previewed for security reasons.
            </p>
            <button
              onClick={onDownload}
              className="btn-tactical-primary flex items-center gap-2 mx-auto"
            >
              <Download className="w-4 h-4" />
              Download File Instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="tactical-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {showWarning ? (
          // Warning Screen
          <>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-warning/10 border border-warning/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Content Warning</h2>
                  <p className="text-sm text-muted-foreground">Preview requires your explicit consent</p>
                </div>
              </div>
              
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6">
              <div className="max-w-2xl mx-auto text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-secondary border border-primary tactical-border flex items-center justify-center mx-auto mb-4">
                    <FileIcon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{fileInfo.originalName}</h3>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span>{formatFileSize(fileInfo.size)}</span>
                    <span>•</span>
                    <span>{getContentTypeLabel()}</span>
                  </div>
                </div>

                <div className="tactical-card p-6 bg-warning/5 border-warning/20 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
                    <div className="text-left">
                      <h4 className="font-semibold text-foreground mb-2">
                        {isSensitive ? '⚠️ Sensitive Content Warning' : '⚠️ Content Preview Warning'}
                      </h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>
                          You are about to preview file content that will be decrypted in your browser.
                          {isSensitive && ' This file may contain sensitive visual content.'}
                        </p>
                        <p>
                          <strong>By proceeding, you confirm that:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>You are authorized to view this content</li>
                          <li>You understand this action will be logged for security purposes</li>
                          <li>You accept responsibility for viewing this content</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleShowPreview}
                    disabled={isDecrypting}
                    className="btn-tactical-primary flex items-center gap-2 justify-center"
                  >
                    {isDecrypting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Decrypting...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show Preview
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={onDownload}
                    className="btn-tactical flex items-center gap-2 justify-center"
                  >
                    <Download className="w-4 h-4" />
                    Download Directly
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // Preview Screen
          <>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground truncate mb-1">
                  {fileInfo.originalName}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{formatFileSize(fileInfo.size)}</span>
                  <span>{fileInfo.mimeType}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Preview mode
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="btn-tactical flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
                
                <button
                  onClick={() => setShowWarning(true)}
                  className="btn-tactical flex items-center gap-2"
                  title="Hide preview"
                >
                  <EyeOff className="w-4 h-4" />
                  Hide
                </button>
                
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              {error ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <AlertTriangle className="w-16 h-16 mb-4 text-destructive" />
                  <p className="text-lg font-medium">Preview Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              ) : (
                renderPreviewContent()
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
