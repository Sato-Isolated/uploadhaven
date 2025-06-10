'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, X, Copy, Key } from 'lucide-react';
import type { UploadedFile } from '@/components/domains/upload/fileuploader/types';
import { getFileType, copyToClipboard } from '@/components/domains/upload/fileuploader/utils';
import { toast } from 'sonner';

interface UploadedFilesListProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onClearCompleted: () => void;
}

export function UploadedFilesList({ 
  files, 
  onRemoveFile, 
  onClearCompleted 
}: UploadedFilesListProps) {
  const handleCopyToClipboard = async (url: string, label?: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      toast.success(`${label || 'Link'} copied to clipboard!`);
    } else {
      toast.error('Failed to copy to clipboard');
    }
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

  if (files.length === 0) return null;

  return (
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
            onClick={onClearCompleted}
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
                  onClick={() => onRemoveFile(file.id)}
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
  );
}
