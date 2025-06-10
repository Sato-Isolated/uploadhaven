"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useFilePreviewLogic } from "./hooks/useFilePreviewLogic";
import { FilePreviewLoadingState } from "./components/FilePreviewLoadingState";
import { FilePreviewErrorState } from "./components/FilePreviewErrorState";
import { FilePreviewPasswordForm } from "./components/FilePreviewPasswordForm";
import { FilePreviewNoFileState } from "./components/FilePreviewNoFileState";
import { FilePreviewHeader } from "./components/FilePreviewHeader";
import { FilePreviewDetails } from "./components/FilePreviewDetails";
import { FilePreviewActions } from "./components/FilePreviewActions";
import { FilePreviewSecurityNotice } from "./components/FilePreviewSecurityNotice";

export default function FilePreviewClient() {
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

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">UploadHaven</h1>
          <p className="text-gray-600">File Preview & Download</p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl">
          <FilePreviewHeader fileInfo={fileInfo} isExpired={isFileExpired} />
          
          <CardContent className="space-y-6">
            <FilePreviewDetails fileInfo={fileInfo} isExpired={isFileExpired} />
            
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

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by UploadHaven - Secure File Sharing</p>
        </div>
      </div>
    </div>
  );
}
