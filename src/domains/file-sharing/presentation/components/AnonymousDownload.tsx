/**
 * Anonymous Download Component - Privacy-first file download interface
 * 
 * Provides secure file download with zero-knowledge decryption.
 * Handles password-protected files and provides download progress.
 * 
 * @domain file-sharing
 * @pattern Presentation Component (DDD)
 * @privacy zero-knowledge - all decryption happens client-side
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useClientDecryption } from '../../../encryption/presentation/hooks/useClientDecryption';

// Privacy-focused UI components
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Progress, Badge, Alert, AlertDescription } from '../../../../shared/presentation/components';

// Icons
import { UploadIcon, ShieldCheckIcon, KeyIcon, ClockIcon, Download, Clock, Eye, Shield, Lock } from 'lucide-react';

interface AnonymousDownloadProps {
  fileId: string;
  encryptionKey?: string; // From URL fragment
  onDownloadComplete?: (filename: string) => void;
  className?: string;
}

/**
 * Anonymous file download component with zero-knowledge decryption
 */
export function AnonymousDownload({
  fileId,
  encryptionKey,
  onDownloadComplete,
  className
}: AnonymousDownloadProps) {
  // File sharing hook for download operations
  // Use the new zero-knowledge decryption hook
  const { downloadAndDecrypt, triggerDownload, isDecrypting, progress, error, result, reset, clearError } = useClientDecryption();

  // Component state
  const [password, setPassword] = useState('');
  const [fileInfo, setFileInfo] = useState<{
    expiresAt: Date;
    maxDownloads: number;
    downloadCount: number;
    isPasswordProtected: boolean;
  } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Load file information on mount
  useEffect(() => {
    loadFileInfo();
  }, [fileId]);

  // Check if password is required
  useEffect(() => {
    if (fileInfo?.isPasswordProtected && !encryptionKey) {
      setShowPasswordForm(true);
    }
  }, [fileInfo, encryptionKey]);  const loadFileInfo = async () => {
    try {
      // Call file-info API to get actual metadata
      const response = await fetch(`/api/file-info/${fileId}`);
      
      if (response.ok) {
        const result = await response.json();
        const info = result.data;
        
        setFileInfo({
          expiresAt: new Date(info.expiresAt),
          maxDownloads: info.maxDownloads === null ? 1000 : info.maxDownloads, // Convert null to our unlimited value
          downloadCount: info.downloadCount,
          isPasswordProtected: false, // Will be determined by download attempt
        });
      } else {
        // If API fails, set minimal default info
        setFileInfo({
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          maxDownloads: 1000, // Default to unlimited
          downloadCount: 0,
          isPasswordProtected: false,
        });
      }
    } catch (error) {
      console.error('Failed to load file info:', error);
      // Set minimal default info
      setFileInfo({
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        maxDownloads: 1000,
        downloadCount: 0,
        isPasswordProtected: false,
      });
    }
  };  const handleDownload = async () => {
    try {
      if (!fileId || !encryptionKey) {
        console.error('Missing fileId or encryptionKey');
        return;
      }

      // Use the new zero-knowledge decryption system
      const result = await downloadAndDecrypt(
        fileId, 
        encryptionKey, 
        fileInfo?.isPasswordProtected ? password : undefined
      );

      if (result) {
        // Trigger the browser download
        triggerDownload(result.file, result.filename);
        
        if (onDownloadComplete) {
          onDownloadComplete(result.filename);
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      handleDownload();
    }
  };
  const getRemainingDownloads = () => {
    if (!fileInfo) return null;
    // If maxDownloads is 1000 (our "unlimited" value), show as unlimited
    if (fileInfo.maxDownloads >= 1000) return null; // null means unlimited
    return Math.max(0, fileInfo.maxDownloads - fileInfo.downloadCount);
  };

  const getTimeRemaining = () => {
    if (!fileInfo) return '';

    const now = new Date();
    const remaining = fileInfo.expiresAt.getTime() - now.getTime();

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };
  const isFileExpired = () => {
    if (!fileInfo) return false;
    const remainingDownloads = getRemainingDownloads();
    return new Date() > fileInfo.expiresAt || (remainingDownloads !== null && remainingDownloads === 0);
  };
  if (!isDecrypting && result) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Download Complete</CardTitle>
          <CardDescription>
            File decrypted and downloaded successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✅ Privacy Protected:</strong> The file was decrypted in your browser.
              No decryption keys were sent to the server.
            </p>
          </div>

          <div className="text-center">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Download Another File
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isFileExpired()) {
    return (
      <Card className={className}>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ClockIcon className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600">File Expired</CardTitle>
          <CardDescription>
            This file is no longer available for download
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <p className="text-sm text-red-800">
              {fileInfo?.expiresAt && new Date() > fileInfo.expiresAt
                ? 'This file has expired and was automatically deleted.'
                : 'This file has reached its maximum download limit.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-privacy-blue" />
              Secure File Download
            </CardTitle>
            <CardDescription>
              Zero-knowledge decryption • Privacy protected
            </CardDescription>
          </div>          {/* Privacy indicators */}
          <div className="flex gap-2">
            <Badge variant="encryption">Encrypted</Badge>
            <Badge variant="anonymous">Anonymous</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Information */}
        {fileInfo && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-temporal-500" />
              <div>
                <p className="text-sm font-medium">Expires in</p>
                <p className="text-sm text-gray-500">{getTimeRemaining()}</p>
              </div>
            </div>            <div className="flex items-center gap-2">
              <UploadIcon className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Downloads left</p>
                <p className="text-sm text-gray-500">
                  {getRemainingDownloads() === null ? 'Unlimited' : getRemainingDownloads()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Password form if required */}
        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <KeyIcon className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">Password Required</p>
              </div>
              <p className="text-sm text-amber-700">
                This file is password protected. Enter the password to decrypt and download.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                File Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter file password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isDecrypting}
                required
              />
            </div>            <Button
              type="submit"
              className="w-full"
              disabled={!password.trim() || isDecrypting}
              variant="encryption"
            >
              {isDecrypting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Decrypting...
                </>
              ) : (
                <>
                  <KeyIcon className="w-4 h-4 mr-2" />
                  🔓 Decrypt & Download
                </>
              )}
            </Button>
          </form>
        )}

        {/* Direct download if key is in URL */}
        {!showPasswordForm && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">              <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">Ready to Download</p>
            </div>
              <p className="text-sm text-blue-700">
                The decryption key was found in the URL. Click below to decrypt and download the file.
              </p>
            </div>

            {/* Download progress */}
            {isDecrypting && (
              <div className="space-y-2">                <div className="flex justify-between text-sm">
                <span>
                  {isDecrypting ? 'Processing...' : 'Ready'}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
                <Progress value={progress} />
              </div>
            )}            <Button
              onClick={handleDownload}
              className="w-full"
              disabled={isDecrypting}
              variant="encryption"
            >{isDecrypting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4 mr-2" />
                🔒 Download Securely
              </>
            )}
            </Button>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-800 mb-1">Download Failed</p>
            <p className="text-sm text-red-700">{error}</p>

            <Button
              onClick={reset}
              variant="outline"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Privacy notice */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>🛡️ Privacy Notice:</strong> This file is decrypted entirely in your browser.
            The server cannot see the file contents or decryption keys.
            Your download is completely private and anonymous.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
