// FilesThumbnail.tsx - File thumbnail component (SRP)

'use client';

import { motion } from 'motion/react';
import { 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive,
  File as FileIcon
} from 'lucide-react';
import type { FilesThumbnailProps } from './types';

/**
 * FilesThumbnail - File thumbnail component
 * Responsibilities:
 * - Displaying file thumbnails or icons
 * - Determining appropriate icon based on MIME type
 * - Handling different sizes and styling
 */
export default function FilesThumbnail({
  mimeType,
  size = 48,
  className = '',
}: FilesThumbnailProps) {
  // Determine file type from MIME type
  const getFileIcon = () => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="h-full w-full" />;
    } else if (mimeType.startsWith('video/')) {
      return <Film className="h-full w-full" />;
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="h-full w-full" />;
    } else if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text')
    ) {
      return <FileText className="h-full w-full" />;
    } else if (
      mimeType.includes('zip') ||
      mimeType.includes('archive') ||
      mimeType.includes('compressed')
    ) {
      return <Archive className="h-full w-full" />;
    } else {
      return <FileIcon className="h-full w-full" />;
    }
  };

  // Get color scheme based on file type
  const getColorScheme = () => {
    if (mimeType.startsWith('image/')) {
      return 'text-green-600 dark:text-green-400';
    } else if (mimeType.startsWith('video/')) {
      return 'text-red-600 dark:text-red-400';
    } else if (mimeType.startsWith('audio/')) {
      return 'text-purple-600 dark:text-purple-400';
    } else if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text')
    ) {
      return 'text-blue-600 dark:text-blue-400';
    } else if (
      mimeType.includes('zip') ||
      mimeType.includes('archive')
    ) {
      return 'text-orange-600 dark:text-orange-400';
    } else {
      return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <div className={`${getColorScheme()} p-2`}>
        {getFileIcon()}
      </div>
    </motion.div>
  );
}
