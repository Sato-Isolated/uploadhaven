'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useFilePreviewLogic } from './hooks/useFilePreviewLogic';
import { FilePreviewLoadingState } from './components/FilePreviewLoadingState';
import { FilePreviewErrorState } from './components/FilePreviewErrorState';
import { FilePreviewPasswordForm } from './components/FilePreviewPasswordForm';
import { FilePreviewNoFileState } from './components/FilePreviewNoFileState';
import { FilePreviewHeader } from './components/FilePreviewHeader';
import { FilePreviewDetails } from './components/FilePreviewDetails';
import { FilePreviewActions } from './components/FilePreviewActions';
import { FilePreviewSecurityNotice } from './components/FilePreviewSecurityNotice';
import { FilePreviewLayout } from './components/FilePreviewLayout';
import {
  ImagePreview,
  VideoPreview,
  AudioPreview,
  PDFPreview,
  TextPreview,
  FallbackPreview,
} from './index';
import { getFileTypeInfo } from './utils/filePreview';
import type { FilePreviewData } from '@/types';

export default function FilePreviewClient() {
  const {
    fileInfo,
    passwordRequired,
    password,
    passwordLoading,
    downloading,
    loading,
    error,
    // Client-side decryption
    isDecrypting,
    decryptedBlobURL,
    decryptionError,
    hasDecryptionKey,
    // Handlers
    handlePasswordSubmit,
    handleDownload,
    handleDecryptedDownload,
    copyShareLink,
    setPassword,
    refetch,
    decryptFileForPreview,
    isFileExpired,
    shortUrl,
  } = useFilePreviewLogic();

  // Loading state
  if (loading) {
    return <FilePreviewLoadingState />;
  }

  // Error state
  if (error) {
    return <FilePreviewErrorState error={error} onRetry={refetch} />;
  }

  // Password required state
  if (passwordRequired) {
    return (
      <FilePreviewPasswordForm
        password={password}
        passwordLoading={passwordLoading}
        onPasswordChange={setPassword}
        onPasswordSubmit={handlePasswordSubmit}
      />
    );
  }
  // No file state
  if (!fileInfo) {
    return <FilePreviewNoFileState />;
  }
  // Function to render file preview with decryption support
  const renderFilePreview = (file: typeof fileInfo) => {
    if (!file) return null;

    // If file has a decryption key but hasn't been decrypted yet
    if (hasDecryptionKey && !decryptedBlobURL && !isDecrypting) {
      return (
        <div className="p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <svg
                className="h-8 w-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            Encrypted File
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            This file is encrypted and requires decryption to preview.
          </p>
          <button
            onClick={decryptFileForPreview}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Decrypt & Preview
          </button>
        </div>
      );
    }

    // If currently decrypting
    if (isDecrypting) {
      return (
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            Decrypting File...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we decrypt your file.
          </p>
        </div>
      );
    }

    // If decryption failed
    if (decryptionError) {
      return (
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
            Decryption Failed
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {decryptionError}
          </p>
          <button
            onClick={decryptFileForPreview}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }    // Convert fileInfo to FilePreviewData format - use decrypted blob URL if available
    const filePreviewData: FilePreviewData = {
      filename: file.name,
      originalName: file.originalName,
      // For ZK files, use the original type instead of the stored mimeType (which is application/octet-stream)
      type: file.isZeroKnowledge ? file.originalType : file.mimeType,
      size: file.size,
      url: decryptedBlobURL || `/api/preview-file/${shortUrl}`, // Use decrypted blob or fallback to API
    };

    // Debug: Log file info for troubleshooting
    console.log('🔍 FILE PREVIEW DEBUG:', {
      isZeroKnowledge: file.isZeroKnowledge,
      originalType: file.originalType,
      mimeType: file.mimeType,
      finalType: filePreviewData.type,
      decryptedBlobURL: decryptedBlobURL ? 'Available' : 'Not available',
      finalURL: filePreviewData.url,
    });

    const typeInfo = getFileTypeInfo(filePreviewData);
    
    console.log('🔍 TYPE INFO DEBUG:', typeInfo);

    if (typeInfo.isImage) return <ImagePreview file={filePreviewData} />;
    if (typeInfo.isVideo) return <VideoPreview file={filePreviewData} />;
    if (typeInfo.isAudio) return <AudioPreview file={filePreviewData} />;
    if (typeInfo.isPdf) return <PDFPreview file={filePreviewData} />;
    if (typeInfo.isText) return <TextPreview file={filePreviewData} />;
    return <FallbackPreview />;
  };

  // Main content
  return (
    <FilePreviewLayout>
      {/* Main Card */}
      <Card className="shadow-xl">
        <FilePreviewHeader fileInfo={fileInfo} isExpired={isFileExpired} />

        <CardContent className="space-y-6">
          <FilePreviewDetails fileInfo={fileInfo} isExpired={isFileExpired} />
          {/* File Content Preview */}
          {!isFileExpired && (
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              {renderFilePreview(fileInfo)}
            </div>
          )}
          <Separator />{' '}
          <FilePreviewActions
            isExpired={isFileExpired}
            downloading={downloading}
            onDownload={handleDownload}
            onCopyShareLink={copyShareLink}
            hasDecryptionKey={hasDecryptionKey}
            isDecrypting={isDecrypting}
            onDecryptedDownload={handleDecryptedDownload}
          />
          <FilePreviewSecurityNotice />
        </CardContent>
      </Card>
    </FilePreviewLayout>
  );
}
