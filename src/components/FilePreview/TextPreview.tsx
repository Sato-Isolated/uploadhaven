"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileData } from "./utils";

interface TextPreviewProps {
  file: FileData;
}

export default function TextPreview({ file }: TextPreviewProps) {
  const [textContent, setTextContent] = useState<string>("");
  const [isLoadingText, setIsLoadingText] = useState(false);

  useEffect(() => {
    if (!textContent) {
      setIsLoadingText(true);
      fetch(file.url)
        .then((response) => response.text())
        .then((text) => setTextContent(text))
        .catch(() => setTextContent("Error loading file content"))
        .finally(() => setIsLoadingText(false));
    }
  }, [file.url, textContent]);

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
