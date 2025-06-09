'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSession } from '@/lib/auth-client';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Copy,
  Key,
  Settings,
  Shield,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

// Import types and utilities from existing FileUploader
import type { UploadedFile } from '@/components/FileUploader/types';
import { MAX_FILE_SIZE, ALLOWED_TYPES, EXPIRATION_OPTIONS } from '@/components/FileUploader/types';
import { getFileType, copyToClipboard, saveFileToLocalStorage } from '@/components/FileUploader/utils';
import { scanFile, logSecurityEvent } from '@/lib/security';
import { validateFileAdvanced } from '@/lib/utils';

export default function DashboardUploadArea() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [expiration, setExpiration] = useState('24h');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { data: session } = useSession();

  const uploadFile = useCallback(
    async (uploadedFile: UploadedFile) => {
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        formData.append('expiration', expiration);

        if (isPasswordProtected) {
          formData.append('autoGenerateKey', 'true');
        }
        if (session?.user?.id) {
          formData.append('userId', session.user.id);
        }

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFiles(prev =>
              prev.map(f =>
                f.id === uploadedFile.id ? { ...f, progress } : f
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            setFiles(prev =>
              prev.map(f =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: 'completed',
                      url: response.downloadUrl,
                      shortUrl: response.shortUrl,
                      generatedKey: response.generatedKey,
                    }
                  : f
              )
            );
            toast.success('File uploaded successfully!');
            
            if (session?.user?.id) {
              const fileInfo = {
                name: response.filename,
                size: uploadedFile.file.size,
                uploadDate: new Date().toISOString(),
                type: getFileType(uploadedFile.file.name),
                expiresAt: response.expiresAt,
              };
              saveFileToLocalStorage(fileInfo);
            }
          } else {
            const errorResponse = JSON.parse(xhr.responseText);
            setFiles(prev =>
              prev.map(f =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: 'error',
                      error: errorResponse.error || 'Upload failed',
                    }
                  : f
              )
            );
            toast.error(`Upload failed: ${errorResponse.error || 'Unknown error'}`);
          }
        };

        xhr.onerror = () => {
          setFiles(prev =>
            prev.map(f =>
              f.id === uploadedFile.id
                ? { ...f, status: 'error', error: 'Network error' }
                : f
            )
          );
          toast.error('Network error during upload');
        };

        xhr.open('POST', '/api/upload');
        xhr.send(formData);      } catch {
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadedFile.id
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          )
        );
        toast.error('Failed to upload file');
      }
    },
    [expiration, isPasswordProtected, session]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = [];

      for (const file of acceptedFiles) {
        // Validate file
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File "${file.name}" is too large. Maximum size is 100MB.`);
          continue;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`File type "${file.type}" is not allowed.`);
          continue;
        }        const advancedValidation = await validateFileAdvanced(file);
        if (!advancedValidation.isValid) {
          toast.error(`File "${file.name}" failed validation: ${advancedValidation.errors[0]}`);
          continue;
        }

        const uploadedFile: UploadedFile = {
          id: nanoid(),
          file,
          progress: 0,
          status: 'scanning',
        };

        newFiles.push(uploadedFile);
      }

      setFiles(prev => [...prev, ...newFiles]);

      // Security scan and upload each file
      for (const uploadedFile of newFiles) {
        try {
          const scanResult = await scanFile(uploadedFile.file);
          
          if (!scanResult.safe) {
            setFiles(prev =>
              prev.map(f =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: 'threat_detected',
                      scanResult,
                      error: `Security threat detected: ${scanResult.threat}`,
                    }
                  : f
              )
            );
              logSecurityEvent(
              'malware_detected',
              `Security threat detected in ${uploadedFile.file.name}: ${scanResult.threat}`,
              'high',
              {
                filename: uploadedFile.file.name,
                fileSize: uploadedFile.file.size,
                fileType: uploadedFile.file.type,
              }
            );
            
            toast.error(`Security threat detected in "${uploadedFile.file.name}"`);
            continue;
          }

          setFiles(prev =>
            prev.map(f =>
              f.id === uploadedFile.id
                ? { ...f, status: 'uploading', scanResult }
                : f
            )
          );          await uploadFile(uploadedFile);
        } catch {
          setFiles(prev =>
            prev.map(f =>
              f.id === uploadedFile.id
                ? { ...f, status: 'error', error: 'Security scan failed' }
                : f
            )
          );
          toast.error(`Failed to scan file "${uploadedFile.file.name}"`);
        }
      }    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'text/*': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'video/mp4': ['.mp4'],
      'audio/mpeg': ['.mp3'],
    },
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCopyToClipboard = async (url: string, label?: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      toast.success(`${label || 'Link'} copied to clipboard!`);
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const getFileIcon = (file: File) => {
    const type = getFileType(file.type);
    switch (type) {
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📄';
      case 'archive':
        return '📦';
      default:
        return '📁';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      <Card className="mb-8 border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Upload className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-2xl">Upload Files</CardTitle>
                  <CardDescription className="text-base">
                    Drag & drop files or click to browse
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Link href="/dashboard/files">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
                  >
                    View All Files
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </CardHeader>
        
        <CardContent className="p-8">
          {/* Upload Settings */}
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border"
            >
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Expires in:</span>
                  <Select value={expiration} onValueChange={setExpiration}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRATION_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-500" />                  <span className="text-sm font-medium">Password protect:</span>
                  <input
                    type="checkbox"
                    id="password-protection"
                    checked={isPasswordProtected}
                    onChange={(e) => setIsPasswordProtected(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                </div>
              </div>
            </motion.div>
          )}          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <motion.div
                className="mx-auto w-16 h-16 mb-4"
                animate={{
                  y: isDragActive ? [0, -10, 0] : [0, -5, 0],
                  scale: isDragActive ? [1, 1.1, 1] : [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl backdrop-blur-sm border border-white/20">
                  <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Drop files here' : 'Upload your files'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag & drop files here or click to browse
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                <Badge variant="secondary">Images</Badge>
                <Badge variant="secondary">Documents</Badge>
                <Badge variant="secondary">Videos</Badge>
                <Badge variant="secondary">Audio</Badge>
                <Badge variant="secondary">Archives</Badge>
              </div>              <p className="text-xs text-gray-500 mt-2">
                Max file size: 100MB
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Files ({files.length})
                </h4>
                {files.some(f => f.status === 'completed') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCompleted}
                    className="text-xs"
                  >
                    Clear Completed
                  </Button>
                )}
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span className="text-2xl">{getFileIcon(file.file)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-gray-900 dark:text-white">
                            {file.file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.status === 'completed' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        {file.status === 'threat_detected' && (
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(file.status === 'scanning' || file.status === 'uploading') && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            {file.status === 'scanning' ? 'Scanning...' : 'Uploading...'}
                          </span>
                          <span className="text-gray-600">{file.progress}%</span>
                        </div>
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}

                    {/* Error Message */}
                    {file.error && (
                      <div className="text-sm text-red-600 mb-2">
                        {file.error}
                      </div>
                    )}

                    {/* Success Actions */}
                    {file.status === 'completed' && file.shortUrl && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyToClipboard(
                            `${window.location.origin}/s/${file.shortUrl}`,
                            'Share link'
                          )}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        {file.generatedKey && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyToClipboard(
                              file.generatedKey!,
                              'Password'
                            )}
                            className="flex-1"
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Copy Password
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
