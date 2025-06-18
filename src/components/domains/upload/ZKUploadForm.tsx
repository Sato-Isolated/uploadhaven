'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Upload,
  Copy,
  Check,
  AlertCircle,
  Lock,
  Key,
} from 'lucide-react';
import { uploadFileZK } from '@/lib/upload/zk-upload-utils';

interface ZKUploadResult {
  shareLink: string;
  isPasswordProtected: boolean;
  expiresAt: string;
  encryptedSize: number;
  keyType: 'password' | 'embedded';
}

export default function ZKUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expiration, setExpiration] = useState('24h');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ZKUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // All hooks must be called before any early returns
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      }
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Use the ZK upload utility
      setUploadProgress(10);
      // Starting Zero-Knowledge upload

      const result = await uploadFileZK(file, {
        password: usePassword && password.trim() ? password.trim() : undefined,
        expiration,
      });

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadProgress(100);

      setResult({
        shareLink: result.url || result.shortUrl || '',
        isPasswordProtected: !!(usePassword && password.trim()),
        expiresAt: result.data?.expiresAt || '',
        encryptedSize: file.size, // We don't have the encrypted size from the utility
        keyType: usePassword && password.trim() ? 'password' : 'embedded',
      }); // Zero-Knowledge upload complete
    } catch (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      setError(
        uploadError instanceof Error ? uploadError.message : 'Upload failed'
      );
    } finally {
      setIsUploading(false);
    }
  }, [file, password, usePassword, expiration]);
  const copyToClipboard = useCallback(async () => {
    if (!result?.shareLink) return;

    try {
      await navigator.clipboard.writeText(result.shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      return true;
    } catch (clipboardError) {
      console.error('Failed to copy to clipboard:', clipboardError);
      return false;
    }
  }, [result?.shareLink]);

  const reset = useCallback(() => {
    setFile(null);
    setPassword('');
    setUsePassword(false);
    setExpiration('24h');
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setResult(null);
    setLinkCopied(false);
  }, []);

  // Check browser compatibility after all hooks
  const checkBrowserCompatibility = () => {
    const features = {
      webCrypto: !!window.crypto?.subtle,
      arrayBuffer: !!window.ArrayBuffer,
      formData: !!window.FormData,
    };

    const missingFeatures = Object.entries(features)
      .filter(([, supported]) => !supported)
      .map(([feature]) => feature);

    return {
      supported: missingFeatures.length === 0,
      missingFeatures,
    };
  };

  const compatibility = checkBrowserCompatibility();
  if (!compatibility.supported) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="text-destructive h-5 w-5" />
            Browser Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn&apos;t support the required encryption features
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
    );  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="text-primary h-5 w-5" />
          Zero-Knowledge File Upload
        </CardTitle>
        <CardDescription>
          Files are encrypted in your browser before upload. The server never
          sees your data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!result ? (
          <>
            {' '}
            {/* File Selection */}
            <div className="space-y-2">
              <label htmlFor="file" className="text-sm font-medium">
                Select File
              </label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="cursor-pointer"
              />
              {file && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span>{file.name}</span>
                  <span>({formatFileSize(file.size)})</span>
                  {file.size > 0 && (
                    <span>
                      → ~
                      {formatFileSize(file.size + Math.ceil(file.size * 0.1))}{' '}
                      encrypted
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* Password Protection */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-password"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  disabled={isUploading}
                  className="rounded border-gray-300"
                />
                <label
                  htmlFor="use-password"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Lock className="h-4 w-4" />
                  Password Protection
                </label>
              </div>

              {usePassword && (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Encryption Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    disabled={isUploading}
                  />
                  <p className="text-muted-foreground text-xs">
                    This password is used to encrypt your file. Lost passwords
                    cannot be recovered.
                  </p>
                </div>
              )}

              {!usePassword && (
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    A random encryption key will be generated and embedded in
                    the share link. Anyone with the complete link can decrypt
                    the file.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            {/* Expiration */}
            <div className="space-y-2">
              <label htmlFor="expiration" className="text-sm font-medium">
                Expiration
              </label>
              <Select
                value={expiration}
                onValueChange={setExpiration}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Encrypting and uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={
                !file || isUploading || (usePassword && !password.trim())
              }
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Encrypting & Uploading...' : 'Encrypt & Upload'}
            </Button>
          </>
        ) : (
          <>
            {/* Success Result */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your file has been encrypted and uploaded successfully!
              </AlertDescription>
            </Alert>{' '}
            {/* Share Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex gap-2">
                <textarea
                  value={result.shareLink}
                  readOnly
                  className="border-input bg-background ring-offset-background flex min-h-[60px] w-full resize-none rounded-md border px-3 py-2 text-sm"
                />
                <Button onClick={copyToClipboard} variant="outline" size="icon">
                  {linkCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                {result.keyType === 'password'
                  ? 'Recipients will need the password to decrypt the file.'
                  : 'The decryption key is embedded in this link. Keep it secure!'}
              </p>
            </div>
            {/* File Info */}
            <div className="bg-muted grid grid-cols-2 gap-4 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium">Encryption</p>
                <p className="text-muted-foreground text-xs">
                  {result.keyType === 'password'
                    ? 'Password-based'
                    : 'Random key'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Encrypted Size</p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(result.encryptedSize)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Expires</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(result.expiresAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Server Knowledge</p>
                <p className="text-muted-foreground text-xs">
                  Zero (encrypted blob only)
                </p>
              </div>
            </div>
            {/* Reset Button */}
            <Button onClick={reset} variant="outline" className="w-full">
              Upload Another File
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
