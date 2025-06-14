'use client';

import { motion } from 'motion/react';
import type { FilePreviewData, BaseComponentProps } from '@/types';
import { useTranslations } from 'next-intl';

interface VideoPreviewProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function VideoPreview({ file }: VideoPreviewProps) {
  const t = useTranslations('FilePreview');

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
      {t('videoNotSupported')}
    </motion.video>
  );
}
