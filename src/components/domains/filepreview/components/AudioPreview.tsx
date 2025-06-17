'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Music, Download, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FilePreviewData, BaseComponentProps } from '@/types';

interface AudioPreviewProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function AudioPreview({ file }: AudioPreviewProps) {
  const t = useTranslations('FilePreview');
  const [audioError, setAudioError] = useState(false);
  const isBlob = file.url?.startsWith('blob:');

  // Debug: Log audio preview info
  console.log('🎵 AUDIO PREVIEW DEBUG:', {
    filename: file.filename,
    originalName: file.originalName,
    type: file.type,
    url: file.url,
    urlType: isBlob ? 'blob' : 'api',
  });

  const handleOpenInNewTab = () => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  const handleDownload = () => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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
            ease: 'easeInOut',
          }}
        >
          <Music className="mx-auto mb-2 h-16 w-16 text-green-500" />
        </motion.div>
        <p className="text-lg font-medium">{file.originalName}</p>
      </div>
      
      {audioError && isBlob ? (
        // Fallback for blob URLs that don't work in audio element
        <div className="text-center space-y-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            Audio ready for playback
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleOpenInNewTab}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      ) : (
        <audio 
          src={file.url} 
          controls 
          className="w-full" 
          preload="metadata"
          onError={() => setAudioError(true)}
        >
          {t('audioNotSupported')}
        </audio>
      )}
      
      {/* Additional controls for blob URLs */}
      {isBlob && !audioError && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-700"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
        </div>
      )}
    </motion.div>
  );
}
