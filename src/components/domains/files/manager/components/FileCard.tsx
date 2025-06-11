// FileCard.tsx - Individual file card component with details and actions

"use client";

import { motion } from "motion/react";
import { formatFileSize } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import FileActionButtons from "./FileActionButtons";
import FileThumbnail from "./FileThumbnail";
import type { FileCardProps } from "../types";

export default function FileCard({
  file,
  index,
  onPreview,
  onCopyLink,
  onDownload,
  onDelete,
  getExpirationStatus,
  getFileIcon,
}: FileCardProps) {
  const expirationStatus = getExpirationStatus(file.expiresAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{
        delay: index * 0.05,
        layout: { duration: 0.3 },
        exit: { duration: 0.2 },
      }}
      className="group relative"
    >
      <motion.div
        className="relative p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-sm hover:shadow-lg transition-all duration-300"
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative flex items-center space-x-6">          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.1, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >            <FileThumbnail
              shortUrl={file.shortUrl}
              mimeType={file.mimeType}
              originalName={file.originalName}
              size={56}
              className="rounded-2xl border border-white/20 bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-sm p-2"
            />
          </motion.div>
          <div className="min-w-0 flex-1">
            <motion.h3
              className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {file.originalName}
            </motion.h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              <span className="font-medium">{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>
                Uploaded
                {formatDistanceToNow(new Date(file.uploadDate), {
                  addSuffix: true,
                })}
              </span>
              {file.downloadCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {file.downloadCount} download
                    {file.downloadCount !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>

            {/* Status badges */}
            <div className="flex items-center space-x-2">
              {expirationStatus.expired ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 rounded-full text-xs font-medium"
                >
                  Expired
                </motion.div>
              ) : expirationStatus.isExpiringSoon ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 rounded-full text-xs font-medium"
                >
                  Expires in {expirationStatus.timeLeft}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 rounded-full text-xs font-medium"
                >
                  Active
                </motion.div>
              )}
            </div>
          </div>
          {/* Action buttons */}
          <FileActionButtons
            onPreview={() => onPreview(file)}
            onCopyLink={() => onCopyLink(file.name)}
            onDownload={() => onDownload(file.name)}
            onDelete={() => onDelete(file.name)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
