"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAsyncOperation } from "@/hooks";
import type { FilePreviewProps } from "@/components/types/common";

interface TextPreviewProps extends FilePreviewProps {}

export default function TextPreview({ file }: TextPreviewProps) {
  const [textContent, setTextContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const { loading: isLoadingText, execute: loadTextContent } =
    useAsyncOperation({
      onSuccess: () => {
        // Success handled in the async function itself
      },
      onError: (errorMessage: string) => {
        setError(errorMessage);
        setTextContent(errorMessage);
      },
    });

  useEffect(() => {
    if (!textContent) {
      loadTextContent(async () => {
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new Error(`Failed to load: ${response.status}`);
        }
        const text = await response.text();
        setTextContent(text);
        setError(null);
      });
    }
  }, [file.url, textContent, loadTextContent]);

  return (
    <motion.div
      className="w-full h-[400px] p-4 bg-white dark:bg-gray-800 rounded border overflow-auto shadow-inner"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
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
      ) : (
        <motion.pre
          className="text-sm font-mono whitespace-pre-wrap break-words"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {textContent}
        </motion.pre>
      )}
    </motion.div>
  );
}
