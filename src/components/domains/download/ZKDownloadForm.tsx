'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Download,
  AlertCircle,
  Lock,
  Key,
  Eye,
  FileText,
} from 'lucide-react';
import {
  decryptFileZK,
  parseZKShareLink,
  checkBrowserCompatibility,
  base64ToArrayBuffer,
} from '@/lib/encryption/zero-knowledge';

interface ZKDownloadState {
  isLoading: boolean;
  needsPassword: boolean;
  isDecrypting: boolean;
  progress: number;
  error: string | null;
  fileInfo: {
    filename: string;
    mimetype: string;
    size: number;
    encryptedSize: number;
  } | null;
  decryptedBlob: Blob | null;
}

interface ZKDownloadFormProps {
  shareUrl?: string;
  className?: string;
}

export default function ZKDownloadForm({
  shareUrl: initialUrl,
  className,
}: ZKDownloadFormProps) {
  const [shareUrl, setShareUrl] = useState(initialUrl || '');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<ZKDownloadState>({
    isLoading: false,
    needsPassword: false,
    isDecrypting: false,
    progress: 0,
    error: null,
    fileInfo: null,
    decryptedBlob: null,
  });

  // Check browser compatibility
  const compatibility = checkBrowserCompatibility();
  if (!compatibility.supported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-destructive h-5 w-5" />
            Browser Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support the required decryption features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Missing features: {compatibility.missingFeatures.join(', ')}
              <br />
              Please use a modern browser (Chrome 37+, Firefox 34+, Safari 7+,
              Edge 12+)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Auto-analyze URL when it changes
  useEffect(() => {
    if (shareUrl && shareUrl.includes('#')) {
      analyzeUrl();
    }
  }, [shareUrl]);

  const analyzeUrl = useCallback(() => {
    if (!shareUrl) return;

    try {
      const linkData = parseZKShareLink(shareUrl);

      setState((prev) => ({
        ...prev,
        needsPassword: !!linkData.password,
        error: null,
      }));

      console.log('🔍 Analyzed share link:', linkData);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Invalid share link format',
      }));
    }
  }, [shareUrl]);

  const fetchFileInfo = useCallback(async (shortUrl: string) => {
    setState((prev) => ({ ...prev, isLoading: true, progress: 10 }));

    try {
      // Make a HEAD request to get file metadata without downloading
      const response = await fetch(`/api/download/${shortUrl}`, {
        method: 'HEAD',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found or has expired');
        }
        throw new Error('Failed to fetch file information');
      }

      const headers = Object.fromEntries(response.headers.entries());

      // Check if it's a ZK encrypted file
      if (headers['x-zk-encrypted'] !== 'true') {
        throw new Error('This file is not Zero-Knowledge encrypted');
      }

      setState((prev) => ({ ...prev, progress: 30 }));

      // Get content length for encrypted size
      const encryptedSize = parseInt(headers['content-length'] || '0');

      return {
        encryptedSize,
        algorithm: headers['x-zk-algorithm'],
        iv: headers['x-zk-iv'],
        salt: headers['x-zk-salt'],
        iterations: parseInt(headers['x-zk-iterations'] || '0'),
        keyHint: headers['x-zk-key-hint'],
      };
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch file info',
      }));
      throw error;
    }
  }, []);

  const downloadAndDecrypt = useCallback(async () => {
    if (!shareUrl) return;

    setState((prev) => ({
      ...prev,
      isDecrypting: true,
      progress: 0,
      error: null,
    }));

    try {
      // Parse the share link
      const linkData = parseZKShareLink(shareUrl);

      if (linkData.password && !password.trim()) {
        setState((prev) => ({
          ...prev,
          isDecrypting: false,
          error: 'Password is required for this file',
        }));
        return;
      }

      setState((prev) => ({ ...prev, progress: 10 }));

      // Fetch file metadata first
      const fileMetadata = await fetchFileInfo(linkData.shortUrl);
      setState((prev) => ({ ...prev, progress: 30 }));

      // Download the encrypted blob
      console.log('📥 Downloading encrypted file...');
      const response = await fetch(`/api/download/${linkData.shortUrl}`);

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const encryptedData = await response.arrayBuffer();
      setState((prev) => ({ ...prev, progress: 60 }));

      // Reconstruct the encrypted package
      const encryptedPackage = {
        encryptedData,
        publicMetadata: {
          size: encryptedData.byteLength,
          algorithm: fileMetadata.algorithm,
          iv: fileMetadata.iv,
          salt: fileMetadata.salt,
          iterations: fileMetadata.iterations,
          uploadTimestamp: Date.now(), // Not critical for decryption
        },
      };

      console.log('🔓 Decrypting file...');
      setState((prev) => ({ ...prev, progress: 80 }));

      // Decrypt the file
      let decrypted;
      if (linkData.key) {
        // Use embedded key
        decrypted = await decryptFileZK(encryptedPackage, linkData.key, false);
      } else if (linkData.password && password.trim()) {
        // Use password
        decrypted = await decryptFileZK(
          encryptedPackage,
          password.trim(),
          true
        );
      } else {
        throw new Error('No decryption key or password available');
      }

      console.log('✅ File decrypted successfully!');
      console.log(`   Filename: ${decrypted.metadata.filename}`);
      console.log(`   MIME type: ${decrypted.metadata.mimetype}`);
      console.log(`   Size: ${decrypted.metadata.size} bytes`);

      setState((prev) => ({
        ...prev,
        isDecrypting: false,
        isLoading: false,
        progress: 100,
        fileInfo: {
          filename: decrypted.metadata.filename,
          mimetype: decrypted.metadata.mimetype,
          size: decrypted.metadata.size,
          encryptedSize: encryptedData.byteLength,
        },
        decryptedBlob: decrypted.file,
      }));
    } catch (error) {
      console.error('❌ Download/decrypt failed:', error);
      setState((prev) => ({
        ...prev,
        isDecrypting: false,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Download/decrypt failed',
      }));
    }
  }, [shareUrl, password, fetchFileInfo]);

  const downloadFile = useCallback(() => {
    if (!state.decryptedBlob || !state.fileInfo) return;

    try {
      // Create download URL
      const url = URL.createObjectURL(state.decryptedBlob);

      // Create temporary download link
      const a = document.createElement('a');
      a.href = url;
      a.download = state.fileInfo.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up
      URL.revokeObjectURL(url);

      console.log('💾 File download initiated');
    } catch (error) {
      console.error('Failed to download file:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to initiate download',
      }));
    }
  }, [state.decryptedBlob, state.fileInfo]);

  const previewFile = useCallback(() => {
    if (!state.decryptedBlob || !state.fileInfo) return;

    try {
      // Create preview URL
      const url = URL.createObjectURL(state.decryptedBlob);

      // Open in new tab for preview
      window.open(url, '_blank');

      // Clean up after a delay (file should be loaded by then)
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      console.log('👁️ File preview opened');
    } catch (error) {
      console.error('Failed to preview file:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to open preview',
      }));
    }
  }, [state.decryptedBlob, state.fileInfo]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      needsPassword: false,
      isDecrypting: false,
      progress: 0,
      error: null,
      fileInfo: null,
      decryptedBlob: null,
    });
    setPassword('');
    setShareUrl('');
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canPreview = (mimetype: string) => {
    return (
      mimetype.startsWith('image/') ||
      mimetype.startsWith('text/') ||
      mimetype === 'application/pdf' ||
      mimetype.startsWith('video/') ||
      mimetype.startsWith('audio/')
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-primary h-5 w-5" />
          Zero-Knowledge File Download
        </CardTitle>
        <CardDescription>
          Decrypt and download files that were encrypted with Zero-Knowledge
          encryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!state.fileInfo ? (
          <>
            {/* Share URL Input */}
            <div className="space-y-2">
              <label htmlFor="share-url" className="text-sm font-medium">
                Share Link
              </label>
              <Input
                id="share-url"
                type="url"
                value={shareUrl}
                onChange={(e) => setShareUrl(e.target.value)}
                placeholder="https://uploadhaven.com/s/abc123#key=..."
                disabled={state.isLoading || state.isDecrypting}
              />
              <p className="text-muted-foreground text-xs">
                Paste the complete share link including the key or password
                fragment
              </p>
            </div>

            {/* Password Input (if needed) */}
            {state.needsPassword && (
              <div className="space-y-2">
                <label
                  htmlFor="decrypt-password"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Lock className="h-4 w-4" />
                  Decryption Password
                </label>
                <Input
                  id="decrypt-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password used to encrypt this file"
                  disabled={state.isLoading || state.isDecrypting}
                />
              </div>
            )}

            {/* Key Type Indicator */}
            {shareUrl && shareUrl.includes('#') && (
              <Alert>
                {state.needsPassword ? (
                  <>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      This file requires a password to decrypt. Enter the
                      password that was used during encryption.
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      This file has an embedded decryption key. No password is
                      required.
                    </AlertDescription>
                  </>
                )}
              </Alert>
            )}

            {/* Progress */}
            {(state.isLoading || state.isDecrypting) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {state.isLoading
                      ? 'Loading file info...'
                      : 'Decrypting file...'}
                  </span>
                  <span>{state.progress}%</span>
                </div>
                <Progress value={state.progress} />
              </div>
            )}

            {/* Error Display */}
            {state.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {/* Decrypt Button */}
            <Button
              onClick={downloadAndDecrypt}
              disabled={
                !shareUrl ||
                state.isLoading ||
                state.isDecrypting ||
                (state.needsPassword && !password.trim())
              }
              className="w-full"
            >
              <Shield className="mr-2 h-4 w-4" />
              {state.isDecrypting ? 'Decrypting...' : 'Decrypt File'}
            </Button>
          </>
        ) : (
          <>
            {/* Success - File Decrypted */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                File decrypted successfully! You can now download or preview it.
              </AlertDescription>
            </Alert>

            {/* File Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="text-muted-foreground h-5 w-5" />
                <div>
                  <h3 className="font-medium">{state.fileInfo.filename}</h3>
                  <p className="text-muted-foreground text-sm">
                    {state.fileInfo.mimetype} •{' '}
                    {formatFileSize(state.fileInfo.size)}
                  </p>
                </div>
              </div>

              <div className="bg-muted grid grid-cols-2 gap-4 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium">Original Size</p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(state.fileInfo.size)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Encrypted Size</p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(state.fileInfo.encryptedSize)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Compression</p>
                  <p className="text-muted-foreground text-xs">
                    {(
                      (1 - state.fileInfo.encryptedSize / state.fileInfo.size) *
                      100
                    ).toFixed(1)}
                    % overhead
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Security</p>
                  <p className="text-muted-foreground text-xs">AES-256-GCM</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={downloadFile} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>

              {canPreview(state.fileInfo.mimetype) && (
                <Button
                  onClick={previewFile}
                  variant="outline"
                  className="flex-1"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              )}
            </div>

            {/* Reset Button */}
            <Button onClick={reset} variant="outline" className="w-full">
              Decrypt Another File
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
