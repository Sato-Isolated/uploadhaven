// FileListContainer.tsx - Container component for the file list with animations

"use client";

import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import FileManagerHeader from "./FileManagerHeader";
import FileCard from "./FileCard";
import type { FileListContainerProps } from "../types";

export default function FileListContainer({
  files,
  onPreview,
  onCopyLink,
  onDownload,
  onDelete,
  getExpirationStatus,
  getFileIcon,
}: FileListContainerProps) {
  const totalSize = files.reduce((total, file) => total + file.size, 0);

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        <FileManagerHeader filesCount={files.length} totalSize={totalSize} />
        <CardContent className="space-y-4">
          <AnimatePresence mode="popLayout">
            {files.map((file, index) => (
              <FileCard
                key={file.name}
                file={file}
                index={index}
                onPreview={onPreview}
                onCopyLink={onCopyLink}
                onDownload={onDownload}
                onDelete={onDelete}
                getExpirationStatus={getExpirationStatus}
                getFileIcon={getFileIcon}
              />
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
