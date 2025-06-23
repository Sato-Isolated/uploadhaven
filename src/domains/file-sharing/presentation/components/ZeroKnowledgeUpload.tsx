/**
 * 🔒 ZeroKnowledgeUpload Component - True DDD Architecture
 * 
 * This component implements proper zero-knowledge file sharing using our
 * encryption domain and DDD architecture. NO LEGACY CODE.
 * 
 * @domain file-sharing + encryption
 * @pattern Presentation Layer (Clean Architecture)
 * @privacy zero-knowledge - client-side encryption only
 */

'use client';

import { useState } from 'react';
import { useClientEncryption } from '@/domains/encryption/presentation/hooks/useClientEncryption';
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, Progress, Select, SelectItem, Checkbox } from '@/shared/presentation/components';
import { Copy, Shield, Clock, Eye } from 'lucide-react';

interface ZeroKnowledgeUploadProps {
  onUploadComplete?: (result: { shareUrl: string; fileId: string }) => void;
}

export function ZeroKnowledgeUpload({ onUploadComplete }: ZeroKnowledgeUploadProps = {}) {
  // Use our proper encryption domain hook
  const { state, encryptFile, reset, clearError } = useClientEncryption();
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);  const [password, setPassword] = useState('');
  const [enablePassword, setEnablePassword] = useState(false);
  const [ttlHours, setTtlHours] = useState('24');
  const [maxDownloads, setMaxDownloads] = useState('10');
  const [enableMaxDownloads, setEnableMaxDownloads] = useState(false);

  // UI state
  const [isDragOver, setIsDragOver] = useState(false);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSet(file);
    }
  };

  const handleClickUpload = () => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileSet = (file: File) => {
    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      // TODO: Show error in UI
      return;
    }
    setSelectedFile(file);
    clearError();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSet(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await encryptFile(selectedFile, {
        password: enablePassword ? password : undefined,
        ttlHours: parseInt(ttlHours),
        maxDownloads: enableMaxDownloads ? parseInt(maxDownloads) : undefined,
      });

      // If successful, state.result will contain the shareUrl
      if (state.result?.shareUrl && onUploadComplete) {
        onUploadComplete({
          shareUrl: state.result.shareUrl,
          fileId: state.result.shareUrl.split('/').pop()?.split('#')[0] || '',
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };const handleReset = () => {
    reset();
    setSelectedFile(null);
    setPassword('');
    setEnablePassword(false);
    setEnableMaxDownloads(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Show success message
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // Show success state if upload completed
  if (state.result?.shareUrl) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            🔒 File Encrypted & Shared Successfully
          </CardTitle>
          <CardDescription className="text-green-700">
            Your file has been encrypted with zero-knowledge and is ready to share.
            The decryption key is embedded in the URL fragment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-green-800 font-medium">Share URL</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                value={state.result.shareUrl} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(state.result!.shareUrl!)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {state.result.metadata && (
            <div className="text-sm text-green-700 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Original size: {(state.result.metadata.originalSize / 1024 / 1024).toFixed(2)} MB
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Encrypted size: {(state.result.metadata.encryptedSize / 1024 / 1024).toFixed(2)} MB
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Algorithm: {state.result.metadata.algorithm}
              </div>
            </div>
          )}

          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              <strong>Privacy Guarantee:</strong> The encryption key is in the URL fragment (after #) 
              and is never sent to our servers. Keep this URL secret.
            </AlertDescription>
          </Alert>

          <Button onClick={handleReset} className="w-full">
            Share Another File
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Zero-Knowledge File Upload
        </CardTitle>
        <CardDescription>
          Files are encrypted in your browser using AES-256-GCM. 
          The server cannot decrypt them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">        {/* File Selection */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : selectedFile 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={selectedFile ? undefined : handleClickUpload}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <div className="text-lg font-medium text-green-800">
                📄 {selectedFile.name}
              </div>
              <div className="text-sm text-green-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
              >
                Remove File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-4xl">📤</div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: 100MB
                </p>
              </div>
            </div>
          )}
          
          {/* Hidden file input */}
          <input
            id="file-input"
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
        </div>{/* Upload Options */}
        <div className="space-y-6">
          {/* File Expiration (Always visible) */}
          <div>
            <Label htmlFor="ttl" className="font-medium">
              ⏰ Auto-delete after
            </Label>            <Select value={ttlHours} onValueChange={setTtlHours}>
              <SelectItem value="1">1 hour</SelectItem>
              <SelectItem value="24">24 hours</SelectItem>
              <SelectItem value="168">7 days</SelectItem>
              <SelectItem value="720">30 days</SelectItem>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              File will be automatically deleted after this time
            </p>
          </div>

          {/* Max Downloads (Optional) */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="max-downloads"
                checked={enableMaxDownloads}
                onCheckedChange={(checked: boolean) => setEnableMaxDownloads(checked)}
              />
              <Label htmlFor="max-downloads" className="font-medium">
                📥 Limit number of downloads (optional)
              </Label>
            </div>

            {enableMaxDownloads && (              <div className="ml-6">
                <Select value={maxDownloads} onValueChange={setMaxDownloads}>
                  <SelectItem value="1">1 download</SelectItem>
                  <SelectItem value="5">5 downloads</SelectItem>
                  <SelectItem value="10">10 downloads</SelectItem>
                  <SelectItem value="25">25 downloads</SelectItem>
                  <SelectItem value="50">50 downloads</SelectItem>
                  <SelectItem value="100">100 downloads</SelectItem>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  File will be deleted after this many downloads
                </p>
              </div>
            )}
          </div>

          {/* Password Protection (Optional) */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="password"
                checked={enablePassword}
                onCheckedChange={(checked: boolean) => setEnablePassword(checked)}
              />
              <Label htmlFor="password" className="font-medium">
                🔐 Require password to download (optional)
              </Label>
            </div>

            {enablePassword && (
              <div className="ml-6">
                <Input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password required for download"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  People will need this password to download your file, in addition to the share link.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {state.isEncrypting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>🔒 Encrypting file...</span>
              <span>{Math.round(state.progress)}%</span>
            </div>
            <Progress value={state.progress} className="w-full" />
            <p className="text-xs text-gray-500">
              Zero-knowledge encryption in progress. Your file is being encrypted locally.
            </p>
          </div>
        )}

        {/* Error Display */}
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>
              ❌ {state.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || state.isEncrypting}
          className="w-full"
          size="lg"
        >
          {state.isEncrypting ? (
            <>
              <Shield className="w-4 h-4 mr-2 animate-spin" />
              Encrypting & Uploading...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              🔒 Encrypt & Share Anonymously
            </>
          )}
        </Button>

        {/* Privacy Reminder */}
        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription>
            <strong>Zero-Knowledge Guarantee:</strong> Your file is encrypted in your browser 
            before upload. The server never sees your encryption keys or file content.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
