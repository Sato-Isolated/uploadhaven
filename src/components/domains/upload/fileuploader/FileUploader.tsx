"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { useFileUploader } from "./hooks/useFileUploader";

// Import existing components
import FileUploaderHeader from "./components/FileUploaderHeader";
import UploadSettings from "./components/UploadSettings";
import DropzoneArea from "./components/DropzoneArea";
import FileProgressList from "./components/FileProgressList";

export default function FileUploader() {
  const {
    files,
    expiration,
    isPasswordProtected,
    isDragActive,
    getRootProps,
    getInputProps,
    setExpiration,
    setIsPasswordProtected,
    handleCopyToClipboard,
    removeFile,
  } = useFileUploader();

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Enhanced Header */}
      <FileUploaderHeader />

      {/* Enhanced Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 backdrop-blur-sm">
          {/* Enhanced Settings Row */}
          <UploadSettings
            expiration={expiration}
            isPasswordProtected={isPasswordProtected}
            onExpirationChange={setExpiration}
            onPasswordProtectionChange={setIsPasswordProtected}
          />
          
          {/* Enhanced Dropzone */}
          <DropzoneArea
            isDragActive={isDragActive}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
          />
        </Card>
      </motion.div>

      {/* File Progress List */}
      <FileProgressList
        files={files}
        onRemoveFile={removeFile}
        onCopyToClipboard={handleCopyToClipboard}
      />
    </div>
  );
}
