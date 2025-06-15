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
import { FilePreviewNavigation } from './components/FilePreviewNavigation';
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
import { useTranslations } from 'next-intl';

export default function FilePreviewClient() {
  const t = useTranslations('FilePreview');
  const tHome = useTranslations('Home');
  const {
    fileInfo,
    passwordRequired,
    password,
    passwordLoading,
    downloading,
    loading,
    error,
    handlePasswordSubmit,
    handleDownload,
    copyShareLink,
    setPassword,
    refetch,
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
  // Function to render file preview based on type
  const renderFilePreview = (file: typeof fileInfo) => {
    // Convert fileInfo to FilePreviewData format
    const filePreviewData: FilePreviewData = {
      filename: file.name,
      originalName: file.originalName,
      type: file.mimeType,
      size: file.size,
      url: `/api/preview-file/${shortUrl}`, // Use preview API instead of download API
    };

    const typeInfo = getFileTypeInfo(filePreviewData);

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

          <Separator />

          <FilePreviewActions
            isExpired={isFileExpired}
            downloading={downloading}
            onDownload={handleDownload}
            onCopyShareLink={copyShareLink}
          />

          <FilePreviewSecurityNotice />
        </CardContent>
      </Card>
    </FilePreviewLayout>
  );
}
