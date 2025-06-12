// filepath: src/hooks/useAdminFileManager.ts
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteFile, useDeleteFiles } from '@/hooks';
import type { AdminFileData } from '@/types';

export function useAdminFileManager(initialFiles: AdminFileData[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showFileDetails, setShowFileDetails] = useState<AdminFileData | null>(
    null
  );
  const [localFiles, setLocalFiles] = useState<AdminFileData[]>(initialFiles);

  // Use TanStack Query mutations for delete operations
  const deleteFileMutation = useDeleteFile();
  const deleteFilesMutation = useDeleteFiles();

  const isLoading =
    deleteFileMutation.isPending || deleteFilesMutation.isPending;

  const filteredFiles = localFiles.filter(
    (file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.mimeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(filteredFiles.map((f) => f.id));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await deleteFilesMutation.mutateAsync(selectedFiles);
      // Remove deleted files from local state
      setLocalFiles((prev) =>
        prev.filter((file) => !selectedFiles.includes(file.id))
      );
      setSelectedFiles([]);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Bulk delete failed:', error);
    }
  };

  const handleDownloadFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/files/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('File downloaded successfully');
      } else {
        throw new Error('Failed to download file');
      }
    } catch {
      toast.error('Failed to download file. Please try again.');
    }
  };

  const handleDeleteFile = async (filename: string) => {
    setFileToDelete(filename);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      await deleteFileMutation.mutateAsync(fileToDelete);
      // Remove deleted file from local state
      setLocalFiles((prev) =>
        prev.filter((file) => file.name !== fileToDelete)
      );
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('File delete failed:', error);
    } finally {
      setFileToDelete(null);
    }
  };

  const handleViewFileDetails = (file: AdminFileData) => {
    setShowFileDetails(file);
  };

  return {
    // State
    searchQuery,
    selectedFiles,
    fileToDelete,
    showFileDetails,
    localFiles,
    filteredFiles,
    isLoading,

    // Handlers
    setSearchQuery,
    handleFileSelect,
    handleSelectAll,
    handleBulkDelete,
    handleDownloadFile,
    handleDeleteFile,
    confirmDeleteFile,
    handleViewFileDetails,
    setShowFileDetails,
    setFileToDelete,
  };
}
