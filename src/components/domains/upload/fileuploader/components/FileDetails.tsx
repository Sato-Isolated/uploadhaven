// components/FileDetails.tsx - File metadata and status information

'use client';

import { motion } from 'motion/react';
import { formatFileSize } from '@/lib/core/utils';
import type { FileHandlerProps } from '@/types';

type FileDetailsProps = Pick<FileHandlerProps, 'file'>;

export default function FileDetails({ file }: FileDetailsProps) {
  // Translation hook removed as security scan messages were removed
  return (<div className="text-muted-foreground mb-2 flex items-center space-x-2 text-xs">
      <span className="font-medium">{formatFileSize(file.file.size)}</span>
      {/* Scanning status removed as part of zero-knowledge architecture */}
      {/* Upload progress */}
      {file.status === 'uploading' && (
        <>
          <span>•</span>
          <motion.span
            key={`${file.id}-progress-${file.progress}`}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}            className="font-semibold text-blue-600 dark:text-blue-400"
          >
            {file.progress}%
          </motion.span>
        </>
      )}
      {/* Threat detection removed as part of zero-knowledge architecture */}
      {/* Error status */}
      {file.error && file.status === 'error' && (
        <>
          <span>•</span>
          <span className="text-red-600 dark:text-red-400">{file.error}</span>
        </>
      )}
      {/* Security scan removed as part of zero-knowledge architecture */}
    </div>
  );
}
