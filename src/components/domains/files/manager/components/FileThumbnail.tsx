"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { getFileIcon } from "@/components/domains/filepreview/utils/fileUtils";
import type { BaseComponentProps } from "@/types";

interface FileThumbnailProps extends BaseComponentProps {
  shortUrl: string;
  mimeType: string;
  originalName: string;
  size?: number; // Size in pixels, defaults to 48
  password?: string; // For password-protected files
}

export default function FileThumbnail({
  shortUrl,
  mimeType,
  originalName,
  size = 48,
  password,
  className = "",
}: FileThumbnailProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

  // Check if this file type supports thumbnails
  const supportsThumbnail = isThumbnailSupported(mimeType);
  
  // Build thumbnail URL
  const thumbnailUrl = supportsThumbnail 
    ? `/api/thumbnail/${shortUrl}${password ? `?password=${encodeURIComponent(password)}` : ''}`
    : null;

  // If thumbnails aren't supported or failed, show icon
  if (!supportsThumbnail || thumbnailError) {
    const IconComponent = getFileIcon(mimeType);
    return (
      <motion.div
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <IconComponent className="w-full h-full text-blue-500" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {thumbnailLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
      
      <Image
        src={thumbnailUrl!}
        alt={`Thumbnail of ${originalName}`}
        width={size}
        height={size}
        className={`object-cover w-full h-full transition-opacity duration-200 ${
          thumbnailLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setThumbnailLoading(false)}
        onError={() => {
          setThumbnailError(true);
          setThumbnailLoading(false);
        }}
        unoptimized // Disable Next.js image optimization since we're using our own thumbnail API
      />
    </motion.div>
  );
}

// Check if file type supports thumbnail generation
function isThumbnailSupported(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType === 'application/pdf'
  );
}
