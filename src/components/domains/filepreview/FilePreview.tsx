'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileHeader,
  FileInfo,
  FileActions,
  ImagePreview,
  VideoPreview,
  AudioPreview,
  TextPreview,
  PDFPreview,
  FallbackPreview,
  getFileTypeInfo,
} from './index';
import type { BaseComponentProps, FilePreviewData } from '@/types';

interface FilePreviewProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  file: FilePreviewData | null;
}

export default function FilePreview({
  isOpen,
  onClose,
  file,
}: FilePreviewProps) {
  if (!file) return null;

  const typeInfo = getFileTypeInfo(file);

  const renderPreview = () => {
    if (typeInfo.isImage) return <ImagePreview key="image" file={file} />;
    if (typeInfo.isVideo) return <VideoPreview key="video" file={file} />;
    if (typeInfo.isAudio) return <AudioPreview key="audio" file={file} />;
    if (typeInfo.isPdf) return <PDFPreview key="pdf" file={file} />;
    if (typeInfo.isText) return <TextPreview key="text" file={file} />;
    return <FallbackPreview key="fallback" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-2xl dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        <DialogHeader>
          <DialogTitle>
            <FileHeader file={file} typeInfo={typeInfo} onClose={onClose} />
          </DialogTitle>
        </DialogHeader>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <FileInfo file={file} />

          <motion.div
            className="flex min-h-[300px] items-center justify-center rounded-lg border border-white/20 bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm dark:from-gray-800/80 dark:to-gray-900/80"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <AnimatePresence mode="wait">{renderPreview()}</AnimatePresence>
          </motion.div>

          <FileActions file={file} />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
