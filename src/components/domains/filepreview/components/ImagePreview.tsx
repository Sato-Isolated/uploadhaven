'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import type { FilePreviewData, BaseComponentProps } from '@/types';
import { useTranslations } from 'next-intl';

interface ImagePreviewProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function ImagePreview({ file }: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const t = useTranslations('Stats');

  if (imageError) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-6xl text-gray-300">🖼️</div>
        <div className="text-gray-600">{t('errorLoadingImage')}</div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative max-h-[500px] max-w-full"
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
        className="max-h-[500px] max-w-full rounded object-contain shadow-lg"
        onError={() => setImageError(true)}
      />
    </motion.div>
  );
}
