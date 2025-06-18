'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Download, 
  Copy,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive
} from 'lucide-react';
import { decryptFileZK, ZKEncryptedPackage, ZKFileMetadata } from '@/lib/encryption/zero-knowledge';
import type { FileInfoData } from './shared/types';

interface ZKFilePreviewProps {
  fileInfo: FileInfoData;
  shortUrl: string;
}

/**
 * Main ZK File Preview Component
 * Handles decryption and preview of zero-knowledge encrypted files
 */
export default function ZKFilePreview({ fileInfo, shortUrl }: ZKFilePreviewProps) {  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localIsDecrypting, setLocalIsDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<Uint8Array | null>(null);
  const [decryptedMetadata, setDecryptedMetadata] = useState<ZKFileMetadata | null>(null);  const [localError, setLocalError] = useState<string | null>(null);

  // Get file type icon
  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image': return <ImageIcon className="h-6 w-6" />;
      case 'video': return <Video className="h-6 w-6" />;
      case 'audio': return <Music className="h-6 w-6" />;
      case 'document': return <FileText className="h-6 w-6" />;
      case 'archive': return <Archive className="h-6 w-6" />;
      default: return <Shield className="h-6 w-6" />;
    }
  };
  // Handle file decryption
  const handleDecrypt = async () => {
    try {
      setLocalIsDecrypting(true);
      setLocalError(null);

      // Fetch the encrypted blob
      const blobResponse = await fetch(`/api/zk-blob/${shortUrl}`);
      if (!blobResponse.ok) {
        throw new Error('Failed to fetch encrypted file');
      }      const encryptedBlob = await blobResponse.arrayBuffer();

      // Determine the decryption key
      let decryptionKey = password;
      if (fileInfo.zkMetadata.keyHint === 'url-fragment' || fileInfo.zkMetadata.keyHint === 'embedded') {
        // For URL fragment keys, we extract from the URL hash
        decryptionKey = window.location.hash.slice(1) || password;
      }

      if (!decryptionKey) {
        setLocalError('Please enter the decryption key');
        return;
      }      // Decrypt the file using the ZK library
      // The blob contains the encrypted data as-is from the server
      console.log('Decryption attempt:', {
        blobSize: encryptedBlob.byteLength,
        keyLength: decryptionKey.length,
        keyHint: fileInfo.zkMetadata.keyHint,
        key: decryptionKey,
        algorithm: fileInfo.zkMetadata.algorithm,
        iv: fileInfo.zkMetadata.iv,
        salt: fileInfo.zkMetadata.salt
      });      // Try to create the proper ZKEncryptedPackage structure
      const encryptedPackage: ZKEncryptedPackage = {
        encryptedData: encryptedBlob,
        publicMetadata: {
          size: fileInfo.zkMetadata.encryptedSize,
          algorithm: fileInfo.zkMetadata.algorithm,
          iv: fileInfo.zkMetadata.iv || '',
          salt: fileInfo.zkMetadata.salt || '',
          iterations: fileInfo.zkMetadata.iterations || fileInfo.zkMetadata.keyDerivation?.iterations || 100000,
          uploadTimestamp: fileInfo.zkMetadata.uploadTimestamp || new Date(fileInfo.zkMetadata.uploadDate).getTime()
        }
      };

      console.log('Encrypted package:', encryptedPackage);

      const isPasswordKey = fileInfo.zkMetadata.keyHint === 'password-protected';
      console.log('Calling decryptFileZK with:', { 
        isPasswordKey, 
        keyHint: fileInfo.zkMetadata.keyHint,
        keyBytes: new TextEncoder().encode(decryptionKey).length
      });
      
      console.log('About to call decryptFileZK...');
      const result = await decryptFileZK(encryptedPackage, decryptionKey, isPasswordKey);
      console.log('Decryption successful!', result.metadata);

      // Convert blob to Uint8Array for our preview
      const arrayBuffer = await result.file.arrayBuffer();
      setDecryptedContent(new Uint8Array(arrayBuffer));
      setDecryptedMetadata(result.metadata);
      
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Decryption failed');
    } finally {
      setLocalIsDecrypting(false);
    }
  };
  // Auto-decrypt if key is in URL fragment
  useEffect(() => {
    if ((fileInfo.zkMetadata.keyHint === 'url-fragment' || fileInfo.zkMetadata.keyHint === 'embedded') && window.location.hash) {
      setPassword(window.location.hash.slice(1));
      // Auto-decrypt after a short delay
      setTimeout(handleDecrypt, 500);
    }
  }, [fileInfo]);

  // Copy download link
  const copyDownloadLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };
  // Download decrypted file
  const downloadFile = () => {
    if (!decryptedContent || !decryptedMetadata) return;

    const blob = new Blob([decryptedContent], { 
      type: decryptedMetadata.mimetype || 'application/octet-stream' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = decryptedMetadata.filename || `file_${shortUrl}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
              {getFileIcon(fileInfo.zkMetadata.contentCategory)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🔒 Encrypted File Preview
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                File ID: {shortUrl} | Category: {fileInfo.zkMetadata.contentCategory}
              </p>
            </div>
          </div>
        </motion.div>

        {/* File Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                File Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Category:</span> {fileInfo.zkMetadata.contentCategory}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {(fileInfo.zkMetadata.encryptedSize / 1024).toFixed(1)} KB
                </div>
                <div>
                  <span className="font-medium">Algorithm:</span> {fileInfo.zkMetadata.algorithm}
                </div>
                <div>
                  <span className="font-medium">Upload Date:</span> {new Date(fileInfo.zkMetadata.uploadDate).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Key Type:</span> {fileInfo.zkMetadata.keyHint === 'url-fragment' ? 'URL Fragment' : 'Password Protected'}
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <span className="ml-1 text-green-600 dark:text-green-400">
                    {fileInfo.isExpired ? '❌ Expired' : '✅ Active'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Decryption Interface */}
        {!decryptedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Decrypt File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fileInfo.zkMetadata.keyHint === 'password-protected' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enter Password:</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter decryption password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}                {(fileInfo.zkMetadata.keyHint === 'url-fragment' || fileInfo.zkMetadata.keyHint === 'embedded') && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 This file uses URL fragment encryption. The decryption key should be in the URL after the # symbol.
                    </p>
                  </div>
                )}{localError && (
                  <Alert variant="destructive">
                    <AlertDescription>{localError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">                  <Button 
                    onClick={handleDecrypt}
                    disabled={localIsDecrypting || (!password && fileInfo.zkMetadata.keyHint === 'password-protected')}
                    className="flex-1"
                  >
                    {localIsDecrypting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Shield className="h-4 w-4" />
                        </motion.div>
                        Decrypting...
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Decrypt & Preview
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={copyDownloadLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Decrypted Content Preview */}
        {decryptedContent && decryptedMetadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-green-600" />
                    Decrypted: {decryptedMetadata.filename}
                  </div>
                  <Button onClick={downloadFile} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileContentPreview 
                  content={decryptedContent}
                  metadata={decryptedMetadata}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Content Preview Component
 * Renders different file types appropriately
 */
function FileContentPreview({ content, metadata }: { content: Uint8Array; metadata: ZKFileMetadata }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = new Blob([content], { type: metadata.mimetype });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [content, metadata]);

  if (!previewUrl) return <div>Loading preview...</div>;

  // Image preview
  if (metadata.mimetype?.startsWith('image/')) {
    return (
      <div className="text-center">
        <img 
          src={previewUrl} 
          alt={metadata.filename}
          className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"        />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {metadata.filename} • {(content.length / 1024).toFixed(1)} KB
        </p>
      </div>
    );
  }

  // Video preview
  if (metadata.mimetype?.startsWith('video/')) {
    return (
      <div className="text-center">
        <video 
          src={previewUrl} 
          controls 
          className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
        >
          Your browser does not support video playback.        </video>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {metadata.filename} • {(content.length / 1024).toFixed(1)} KB
        </p>
      </div>
    );
  }

  // Audio preview
  if (metadata.mimetype?.startsWith('audio/')) {
    return (
      <div className="text-center">
        <audio 
          src={previewUrl} 
          controls 
          className="w-full max-w-md mx-auto"
        >
          Your browser does not support audio playback.        </audio>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {metadata.filename} • {(content.length / 1024).toFixed(1)} KB
        </p>
      </div>
    );
  }

  // Text files
  if (metadata.mimetype?.startsWith('text/') || metadata.mimetype === 'application/json') {
    const textContent = new TextDecoder().decode(content);
    return (
      <div>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96 text-sm">
          {textContent}        </pre>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {metadata.filename} • {(content.length / 1024).toFixed(1)} KB
        </p>
      </div>
    );
  }

  // PDF preview (basic - would need PDF.js for full preview)
  if (metadata.mimetype === 'application/pdf') {
    return (
      <div className="text-center p-8">
        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">PDF File</p>        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {metadata.filename} • {(content.length / 1024).toFixed(1)} KB
        </p>
        <a 
          href={previewUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <Eye className="h-4 w-4" />
          View PDF in new tab
        </a>
      </div>
    );
  }

  // Generic file preview
  return (
    <div className="text-center p-8">
      <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
      <p className="text-lg font-medium mb-2">File Ready</p>      <p className="text-sm text-gray-600 dark:text-gray-400">
        {metadata.filename} • {(content.length / 1024).toFixed(1)} KB
      </p>
      <p className="text-xs text-gray-500 mt-2">
        Preview not available for this file type. Use the download button to save the file.
      </p>
    </div>
  );
}
