'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileX } from 'lucide-react';
import ZKFilePreview from './ZKFilePreview';
import type { 
  FileInfoResponse, 
  FileInfoData,
  PreviewError 
} from './shared/types';

/**
 * FilePreviewRouter - Main entry point for the new ZK-only preview system
 * 
 * This component:
 * 1. Fetches file information (all files are ZK encrypted)
 * 2. Routes to the ZK preview component
 * 3. Handles loading states and errors
 */
export default function FilePreviewRouter() {
  const params = useParams();
  const shortUrl = params.shortUrl as string;
  
  // State management
  const [fileInfo, setFileInfo] = useState<FileInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PreviewError | null>(null);

  /**
   * Fetch file information from the new API endpoint
   */
  const fetchFileInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/file-info/${shortUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('File not found');
        }
        if (response.status === 410) {
          throw new Error('File has expired');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }      const result: FileInfoResponse = await response.json();      console.log('FilePreviewRouter - API Response:', {
        success: result.success,
        data: result.data,
        zkMetadata: result.data?.zkMetadata,
        zkMetadataKeys: result.data?.zkMetadata ? Object.keys(result.data.zkMetadata) : null
      });

      // Debug: Log the exact structure of result.data
      console.log('FilePreviewRouter - result.data structure:', result.data);
      console.log('FilePreviewRouter - result.data keys:', Object.keys(result.data || {}));
      console.log('FilePreviewRouter - result.data.zkMetadata:', result.data?.zkMetadata);

      if (!result.success) {
        throw new Error('Failed to fetch file information');
      }

      setFileInfo(result.data);
    } catch (err) {
      console.error('Failed to fetch file info:', err);
      
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      
      setError({
        type: message.includes('not found') ? 'file-not-found' :
              message.includes('expired') ? 'expired' :
              message.includes('network') ? 'network' : 'unknown',
        message
      });
    } finally {
      setIsLoading(false);
    }
  }, [shortUrl]);

  // Fetch file information on mount
  useEffect(() => {
    if (!shortUrl) {
      setError({
        type: 'file-not-found',
        message: 'No file URL provided'
      });
      setIsLoading(false);
      return;
    }

    fetchFileInfo();
  }, [shortUrl, fetchFileInfo]);

  /**
   * Retry function for error states
   */
  const handleRetry = () => {
    fetchFileInfo();
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[400px] items-center justify-center"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
            <h3 className="mb-2 text-lg font-medium">Loading File Information</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Determining file type and preparing preview...
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[400px] items-center justify-center"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <FileX className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                {error.type === 'file-not-found' ? 'File Not Found' :
                 error.type === 'expired' ? 'File Expired' :
                 error.type === 'network' ? 'Network Error' :
                 'Error Loading File'}
              </h3>
            </div>

            <Alert>
              <AlertDescription>
                {error.message}
              </AlertDescription>
            </Alert>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRetry}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Try Again
            </motion.button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  /**
   * Render appropriate preview component based on file type
   */
  if (!fileInfo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[400px] items-center justify-center"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <FileX className="mx-auto mb-4 h-8 w-8 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
              No File Information
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Unable to load file information. Please try again.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Debug log before passing to ZKFilePreview */}
      {(() => {
        console.log('FilePreviewRouter - Passing to ZKFilePreview:', {
          fileInfo,
          hasZkMetadata: !!fileInfo?.zkMetadata,
          zkMetadataKeys: fileInfo?.zkMetadata ? Object.keys(fileInfo.zkMetadata) : null,
          shortUrl
        });
        return null;
      })()}
      
      {/* All files are ZK encrypted in our new system */}
      <ZKFilePreview fileInfo={fileInfo} shortUrl={shortUrl} />
    </motion.div>
  );
}

/**
 * Export for easier integration in the main page
 */
export { FilePreviewRouter };
