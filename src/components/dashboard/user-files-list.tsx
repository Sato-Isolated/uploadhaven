"use client";

import { useState } from "react";
import { PaginationParams, PaginatedResult, SerializedFile } from "@/domains/user/user-file-types";
import { useDeleteFile, useFileActions } from "@/hooks/use-user-files";
import { FileCard } from "./file-card";
import { DeleteConfirmation } from "./delete-confirmation";
import { 
  FileIcon, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from "lucide-react";

interface UserFilesListProps {
  files?: PaginatedResult<SerializedFile>;
  isLoading: boolean;
  error: Error | null;
  pagination: PaginationParams;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: 'createdAt' | 'name' | 'size') => void;
}

export function UserFilesList({ 
  files, 
  isLoading, 
  error, 
  pagination, 
  onPageChange, 
  onSortChange 
}: UserFilesListProps) {
  const [fileToDelete, setFileToDelete] = useState<SerializedFile | null>(null);
  
  const deleteFileMutation = useDeleteFile();
  const { copyShareLink } = useFileActions();

  const handleDeleteConfirm = async () => {
    if (fileToDelete) {
      await deleteFileMutation.mutateAsync(fileToDelete.id);
      setFileToDelete(null);
    }
  };

  const getSortIcon = (sortBy: 'createdAt' | 'name' | 'size') => {
    if (pagination.sortBy !== sortBy) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return pagination.sortOrder === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="tactical-card p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading your files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tactical-card p-8 border-destructive bg-destructive/10">
        <div className="flex items-center justify-center text-destructive">
          <AlertCircle className="w-6 h-6 mr-3" />
          <div>
            <p className="font-medium">Failed to load files</p>
            <p className="text-sm text-destructive/80">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!files || files.data.length === 0) {
    return (
      <div className="tactical-card p-12 text-center">
        <FileIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No files found</h3>
        <p className="text-muted-foreground">
          {Object.keys(pagination).length > 0 
            ? "Try adjusting your search filters or upload your first file."
            : "Upload your first file to get started."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec tri */}
      <div className="tactical-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Your Files ({files.total})
          </h3>
          
          {/* Options de tri */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <button
              onClick={() => onSortChange('createdAt')}
              className={`btn-tactical-small flex items-center gap-1 ${
                pagination.sortBy === 'createdAt' ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              Date {getSortIcon('createdAt')}
            </button>
            <button
              onClick={() => onSortChange('name')}
              className={`btn-tactical-small flex items-center gap-1 ${
                pagination.sortBy === 'name' ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              Name {getSortIcon('name')}
            </button>
            <button
              onClick={() => onSortChange('size')}
              className={`btn-tactical-small flex items-center gap-1 ${
                pagination.sortBy === 'size' ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              Size {getSortIcon('size')}
            </button>
          </div>
        </div>

        {/* Informations de pagination */}
        <div className="text-sm text-muted-foreground">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, files.total)} of {files.total} files
        </div>
      </div>

      {/* Grille des fichiers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {files.data.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onDelete={() => setFileToDelete(file)}
            onCopyLink={copyShareLink}
          />
        ))}
      </div>

      {/* Pagination */}
      {files.totalPages > 1 && (
        <div className="tactical-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {files.totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!files.hasPrev}
                className="btn-tactical flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              {/* Pages */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, files.totalPages) }, (_, i) => {
                  let pageNum;
                  if (files.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= files.totalPages - 2) {
                    pageNum = files.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`w-8 h-8 text-sm border border-border ${
                        pageNum === pagination.page
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground hover:bg-secondary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!files.hasNext}
                className="btn-tactical flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {fileToDelete && (
        <DeleteConfirmation
          file={fileToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setFileToDelete(null)}
          isDeleting={deleteFileMutation.isPending}
        />
      )}
    </div>
  );
}
