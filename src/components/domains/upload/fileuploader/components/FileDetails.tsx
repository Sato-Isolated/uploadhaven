// components/FileDetails.tsx - File metadata and status information

"use client";

import { motion } from "motion/react";
import { formatFileSize } from "@/lib/utils";
import type { FileHandlerProps } from "@/types";

type FileDetailsProps = Pick<FileHandlerProps, "file">;

export default function FileDetails({ file }: FileDetailsProps) {
  return (
    <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
      <span className="font-medium">{formatFileSize(file.file.size)}</span>
      {/* Scanning status */}
      {file.status === "scanning" && (
        <>
          <span>•</span>
          <motion.span
            className="text-blue-600 dark:text-blue-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🔍 Security scan in progress...
          </motion.span>
        </>
      )}
      {/* Upload progress */}
      {file.status === "uploading" && (
        <>
          <span>•</span>
          <motion.span
            key={`${file.id}-progress-${file.progress}`}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="font-semibold text-blue-600 dark:text-blue-400"
          >
            {file.progress}%
          </motion.span>
        </>
      )}
      {/* Threat detected */}
      {file.status === "threat_detected" && (
        <>
          <span>•</span>
          <motion.span
            className="text-red-600 dark:text-red-400 font-medium"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ⚠️ {file.error}
          </motion.span>
        </>
      )}
      {/* Error status */}
      {file.error && file.status === "error" && (
        <>
          <span>•</span>
          <span className="text-red-600 dark:text-red-400">{file.error}</span>
        </>
      )}
      {/* Security scan complete */}
      {file.scanResult?.safe && file.status === "completed" && (
        <>
          <span>•</span>
          <motion.span
            className="text-green-600 dark:text-green-400 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            ✅ Secure
          </motion.span>
        </>
      )}
    </div>
  );
}
