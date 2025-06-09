"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  FileUploadOptions,
  FileDeleteOptions,
} from "@/components/types/common";

/**
 * Custom hook for file operations including upload, delete, and management.
 * Consolidates file handling logic used across FileUploader, AdminFileManager, etc.
 */
export function useFileOperations() {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadFile = useCallback(
    async (
      file: File,
      options: FileUploadOptions & {
        expiration?: string;
        password?: string;
        userId?: string;
      } = {}
    ) => {
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        if (options.expiration) {
          formData.append("expiration", options.expiration);
        }

        if (options.password) {
          formData.append("password", options.password);
        }

        if (options.userId) {
          formData.append("userId", options.userId);
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Upload failed");
        }

        toast.success("File uploaded successfully!");
        options.onSuccess?.(result);

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(errorMessage);
        options.onError?.(errorMessage);
        throw error;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const deleteFile = useCallback(
    async (filename: string, options: FileDeleteOptions = {}) => {
      setDeleting(true);

      try {
        const response = await fetch("/api/bulk-delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filenames: [filename],
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Delete failed");
        }

        toast.success("File deleted successfully!");
        options.onSuccess?.();

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Delete failed";
        toast.error(errorMessage);
        options.onError?.(errorMessage);
        throw error;
      } finally {
        setDeleting(false);
      }
    },
    []
  );

  const deleteMultipleFiles = useCallback(
    async (filenames: string[], options: FileDeleteOptions = {}) => {
      setDeleting(true);

      try {
        const response = await fetch("/api/bulk-delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filenames,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Bulk delete failed");
        }

        toast.success(`Successfully deleted ${result.deletedCount} files`);
        options.onSuccess?.();

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Bulk delete failed";
        toast.error(errorMessage);
        options.onError?.(errorMessage);
        throw error;
      } finally {
        setDeleting(false);
      }
    },
    []
  );

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      const MAX_SIZE = 100 * 1024 * 1024; // 100MB
      const ALLOWED_TYPES = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "text/plain",
        "application/pdf",
        "application/zip",
        "video/mp4",
        "audio/mpeg",
      ];

      if (file.size > MAX_SIZE) {
        return { valid: false, error: "File size must be less than 100MB" };
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: "File type not allowed" };
      }

      return { valid: true };
    },
    []
  );

  return {
    uploading,
    deleting,
    uploadFile,
    deleteFile,
    deleteMultipleFiles,
    validateFile,
  };
}
