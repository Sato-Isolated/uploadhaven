"use client";

import { motion } from "motion/react";
import { FileData } from "./utils";

interface PDFPreviewProps {
  file: FileData;
}

export default function PDFPreview({ file }: PDFPreviewProps) {
  return (
    <motion.iframe
      src={file.url}
      className="w-full h-[500px] rounded shadow-lg"
      title={file.originalName}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    />
  );
}
