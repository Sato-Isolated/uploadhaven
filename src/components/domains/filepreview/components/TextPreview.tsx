"use client";

import { motion } from "motion/react";
import { useTextPreview } from "@/hooks/useFilePreview";
import type { FilePreviewData, BaseComponentProps } from "@/types";

interface TextPreviewProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function TextPreview({ file }: TextPreviewProps) {
  // Use TanStack Query for better caching and error handling
  const {
    data: textContent,
    isLoading: isLoadingText,
    error,
  } = useTextPreview(file.url);

  return (
    <motion.div
      className="w-full h-[400px] p-4 bg-white dark:bg-gray-800 rounded border overflow-auto shadow-inner"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}    >
      {isLoadingText ? (
        <motion.div
          className="flex items-center justify-center h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="text-gray-500"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading content...
          </motion.div>
        </motion.div>
      ) : error ? (
        <motion.div
          className="flex items-center justify-center h-full text-red-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Error loading content: {error.message}
        </motion.div>
      ) : (
        <motion.pre
          className="text-sm font-mono whitespace-pre-wrap break-words"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {textContent || 'No content available'}
        </motion.pre>
      )}
    </motion.div>
  );
}
