// FilesManager.tsx - Main orchestrator for file management in dashboard (SRP)

'use client';

import { useSession } from '@/lib/auth/auth-client';
import { useFiles, useDeleteFile } from '@/hooks';
import { useTranslations } from 'next-intl';
import { useCallback, useRef } from 'react';

import FilesContainer from './FilesContainer';
import FilesList from './FilesList';
import FilesEmptyState from './FilesEmptyState';
import FilesLoadingState from './FilesLoadingState';
import FilesErrorState from './FilesErrorState';

import type { FilesManagerProps, FileInfo } from './types';

/**
 * FilesManager - Main orchestrator component for file management
 * Responsibilities:
 * - Fetching and managing file data
 * - Handling file actions (delete only for zero-knowledge)
 * - Managing loading/error states
 * - Coordinating between child components
 */
export default function FilesManager({ className = '' }: FilesManagerProps) {
  const t = useTranslations('Files');
  const { data: session } = useSession();
  
  // Ref to track files being deleted to prevent double calls
  const deletingFileIds = useRef(new Set<string>());
  
  // TanStack Query hooks for data fetching - fetch only current user's files
  const { data: files = [], isLoading, error, refetch } = useFiles({ 
    userId: session?.user?.id 
  });
  const deleteFileMutation = useDeleteFile();

  // Calculate total size for header
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  // File action handlers with double-call protection
  const handleDelete = useCallback(async (file: FileInfo) => {
    // Prevent multiple calls for the same file
    if (deletingFileIds.current.has(file.id)) {
      console.log('Delete already in progress for file:', file.id);
      return;
    }
    
    // Add file ID to the set of files being deleted
    deletingFileIds.current.add(file.id);
    
    try {
      await deleteFileMutation.mutateAsync(file.id);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      // Always remove from set when done (success or error)
      deletingFileIds.current.delete(file.id);
    }
  }, [deleteFileMutation]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return <FilesLoadingState className={className} />;
  }

  // Error state
  if (error) {
    return (
      <FilesErrorState
        error={error.message}
        onRetry={handleRefresh}
        className={className}
      />
    );
  }

  // Empty state
  if (files.length === 0) {
    return <FilesEmptyState className={className} />;
  }
  // Main render
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <FilesContainer
        files={files}
        totalSize={totalSize}
        onRefresh={handleRefresh}
      >
        <FilesList
          files={files}
          onDelete={handleDelete}
          deleteLoading={deleteFileMutation.isPending}
        />
      </FilesContainer>
    </div>
  );
}
