'use client';

import { motion } from 'motion/react';
import type { FilePreviewData, BaseComponentProps } from '@/types';

interface VideoPreviewProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function VideoPreview({ file }: VideoPreviewProps) {
  return (
    <motion.video
      src={file.url}
      controls
      className="max-h-[500px] max-w-full rounded shadow-lg"
      preload="metadata"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      Your browser does not support video playback.
    </motion.video>
  );
}
