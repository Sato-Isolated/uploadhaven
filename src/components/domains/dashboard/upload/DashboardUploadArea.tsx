'use client';

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardUpload } from './hooks/useDashboardUpload';
import { UploadHeader } from './components/UploadHeader';
import { UploadSettings } from './components/UploadSettings';
import { UploadDropzone } from './components/UploadDropzone';
import { UploadedFilesList } from './components/UploadedFilesList';

export function DashboardUploadArea() {
  const {
    files,
    expiration,
    isPasswordProtected,
    showSettings,
    processFiles,
    removeFile,
    clearCompleted,
    toggleSettings,
    setExpiration,
    setIsPasswordProtected,
  } = useDashboardUpload();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      <Card className="mb-8 border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-xl backdrop-blur-sm dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        <UploadHeader onToggleSettings={toggleSettings} />

        <CardContent className="p-8">
          <UploadSettings
            showSettings={showSettings}
            expiration={expiration}
            isPasswordProtected={isPasswordProtected}
            onExpirationChange={setExpiration}
            onPasswordProtectedChange={setIsPasswordProtected}
          />

          <UploadDropzone onFileDrop={processFiles} />

          <UploadedFilesList
            files={files}
            onRemoveFile={removeFile}
            onClearCompleted={clearCompleted}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
