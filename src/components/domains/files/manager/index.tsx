// index.tsx - Main FileManager orchestrating component

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useFiles, useDeleteFile } from '@/hooks';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
} from 'lucide-react';
import { FilePreview } from '../../filepreview';
import LoadingIndicator from './components/LoadingIndicator';
import EmptyState from './components/EmptyState';
import FileListContainer from './components/FileListContainer';
import type { FilePreviewData } from '@/types';
import type { FileInfo, ExpirationStatus, FileManagerProps } from './types';
import { useTranslations } from 'next-intl';

export default function FileManager({ className = '' }: FileManagerProps) {
  const t = useTranslations('Files');
  const [previewFile, setPreviewFile] = useState<FilePreviewData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Use TanStack Query for better performance and caching
  const { data: files = [], isLoading: loading } = useFiles();

  // Use TanStack Query mutation for deleting files
  const deleteFileMutation = useDeleteFile();

  const getFileIcon = (type: FileInfo['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Film className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'archive':
        return <Archive className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const copyLink = (filename: string) => {
    const url = `${window.location.origin}/api/files/${filename}`;
    navigator.clipboard.writeText(url);
    toast.success(t('linkCopied'));
  };

  const downloadFile = (filename: string) => {
    const url = `${window.location.origin}/api/files/${filename}`;
    window.open(url, '_blank');
  };
  const deleteFile = async (filename: string) => {
    deleteFileMutation.mutate(filename);
  };

  const getExpirationStatus = (expiresAt?: string | null): ExpirationStatus => {
    if (!expiresAt) {
      return {
        text: t('neverExpires'),
        variant: 'secondary' as const,
        expired: false,
        isExpiringSoon: false,
        timeLeft: '',
      };
    }

    const now = new Date();
    const expiration = new Date(expiresAt);
    const timeLeft = expiration.getTime() - now.getTime();

    if (timeLeft <= 0) {
      return {
        text: t('expired'),
        variant: 'destructive' as const,
        expired: true,
        isExpiringSoon: false,
        timeLeft: '',
      };
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return {
        text: t('expiresInDays', { count: days }),
        variant: days <= 1 ? ('destructive' as const) : ('secondary' as const),
        expired: false,
        isExpiringSoon: days <= 1,
        timeLeft: `${days} ${days > 1 ? t('days') : t('day')}`,
      };
    } else if (hours > 0) {
      return {
        text: t('expiresInHours', { count: hours }),
        variant: hours <= 2 ? ('destructive' as const) : ('secondary' as const),
        expired: false,
        isExpiringSoon: hours <= 2,
        timeLeft: `${hours} ${hours > 1 ? t('hours') : t('hour')}`,
      };
    } else {
      const minutes = Math.floor(timeLeft / (1000 * 60));
      return {
        text: t('expiresInMinutes', { count: minutes }),
        variant: 'destructive' as const,
        expired: false,
        isExpiringSoon: true,
        timeLeft: `${minutes} ${minutes > 1 ? t('minutes') : t('minute')}`,
      };
    }
  };

  const openPreview = (file: FileInfo) => {
    setPreviewFile({
      filename: file.name,
      originalName: file.originalName,
      type: file.mimeType,
      size: file.size,
      url: `${window.location.origin}/api/files/${file.name}`,
    });
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  if (loading) {
    return <LoadingIndicator />;
  }
  if (files.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={className}>
      <FileListContainer
        files={files}
        onPreview={openPreview}
        onCopyLink={copyLink}
        onDownload={downloadFile}
        onDelete={deleteFile}
        getExpirationStatus={getExpirationStatus}
        getFileIcon={getFileIcon}
      />

      <FilePreview
        isOpen={isPreviewOpen}
        onClose={closePreview}
        file={previewFile}
      />
    </div>
  );
}
