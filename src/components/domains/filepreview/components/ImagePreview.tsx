"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import type { FilePreviewData, BaseComponentProps } from "@/types";

interface ImagePreviewProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function ImagePreview({ file }: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="text-center space-y-4">
        <div className="text-6xl text-gray-300">🖼️</div>
        <div className="text-gray-600">Error loading image</div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative max-w-full max-h-[500px]"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Image
        src={file.url}
        alt={file.originalName}
        width={800}
        height={500}
        className="max-w-full max-h-[500px] object-contain rounded shadow-lg"
        onError={() => setImageError(true)}
      />
    </motion.div>
  );
}
