import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  type LucideIcon,
} from "lucide-react";

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get appropriate icon component for file MIME type
 */
export function getFileIcon(mimeType: string | undefined): LucideIcon {
  if (!mimeType) return File;
  
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("zip") || mimeType.includes("archive"))
    return Archive;
  if (mimeType.startsWith("text/") || mimeType.includes("document"))
    return FileText;
  
  return File;
}

/**
 * Get human readable file type label from MIME type
 */
export function getFileTypeLabel(mimeType: string | undefined): string {
  if (!mimeType) return "File";
  
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("zip") || mimeType.includes("archive"))
    return "Archive";
  if (mimeType.startsWith("text/")) return "Text";
  if (mimeType.includes("pdf")) return "PDF";
  
  return "File";
}
