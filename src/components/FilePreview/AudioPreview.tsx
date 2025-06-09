"use client";

import { motion } from "motion/react";
import { Music } from "lucide-react";
import type { FilePreviewProps } from "@/components/types/common";

interface AudioPreviewProps extends FilePreviewProps {}

export default function AudioPreview({ file }: AudioPreviewProps) {
  return (
    <motion.div
      className="w-full max-w-md space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Music className="w-16 h-16 mx-auto text-green-500 mb-2" />
        </motion.div>
        <p className="text-lg font-medium">{file.originalName}</p>
      </div>
      <audio src={file.url} controls className="w-full" preload="metadata">
        Your browser does not support audio playback.
      </audio>
    </motion.div>
  );
}
