// File type detection and utility functions for FilePreview components

// Import centralized types
import type { FilePreviewData, FileTypeInfo } from '@/types';

export type { FilePreviewData as FileData, FileTypeInfo } from '@/types';

// Get file type information
export function getFileTypeInfo(file: FilePreviewData | null): FileTypeInfo {
  if (!file) {
    return {
      isImage: false,
      isVideo: false,
      isAudio: false,
      isText: false,
      isPdf: false,
      isCode: false,
    };
  }

  const isImage = file.type?.startsWith('image/') || false;
  const isVideo = file.type?.startsWith('video/') || false;
  const isAudio = file.type?.startsWith('audio/') || false;
  const isText = file
    ? file.type?.startsWith('text/') ||
      [
        'application/json',
        'application/xml',
        'application/javascript',
      ].includes(file.type || '') ||
      Boolean(
        file.originalName.match(
          /\.(md|txt|json|xml|js|ts|tsx|jsx|css|scss|html|yml|yaml|toml|ini|cfg|conf|log)$/i
        )
      )
    : false;
  const isPdf = file.type === 'application/pdf' || false;
  const isCode =
    Boolean(
      file.originalName.match(
        /\.(js|ts|tsx|jsx|py|java|cpp|c|cs|php|rb|go|rs|swift|kt|dart|vue|svelte)$/i
      )
    ) || false;

  return {
    isImage,
    isVideo,
    isAudio,
    isText,
    isPdf,
    isCode,
  };
}

// Get file type display string
export function getFileTypeDisplay(typeInfo: FileTypeInfo): string {
  if (typeInfo.isImage) return 'Image';
  if (typeInfo.isVideo) return 'Video';
  if (typeInfo.isAudio) return 'Audio';
  if (typeInfo.isCode) return 'Code';
  if (typeInfo.isText) return 'Text';
  if (typeInfo.isPdf) return 'PDF';
  return 'File';
}

// Handle file download
export function handleFileDownload(file: FilePreviewData) {
  const link = document.createElement('a');
  link.href = file.url;
  link.download = file.originalName;
  link.click();
}

// Handle opening file in new tab
export function handleFileOpenInNewTab(file: FilePreviewData) {
  window.open(file.url, '_blank');
}
