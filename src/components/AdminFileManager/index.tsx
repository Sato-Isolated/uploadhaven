"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { AdminFileManagerProps, FileData } from "./types";
import StatisticsGrid from "./components/StatisticsGrid";
import SearchAndFilters from "./components/SearchAndFilters";
import FilesTable from "./components/FilesTable";
import { FileDetailsModal, DeleteConfirmationModal } from "./modals";

export default function AdminFileManager({ files }: AdminFileManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showFileDetails, setShowFileDetails] = useState<FileData | null>(null);
  const [localFiles, setLocalFiles] = useState<FileData[]>(files);
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    try {
      const response = await fetch("/api/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filenames: selectedFiles,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove deleted files from local state
        setLocalFiles((prev) =>
          prev.filter((file) => !selectedFiles.includes(file.id))
        );
        setSelectedFiles([]);
        toast.success(`Successfully deleted ${result.deletedCount} files`);
      } else {
        throw new Error(result.error || "Failed to delete files");
      }
    } catch {
      toast.error("Failed to delete files. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/files/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("File downloaded successfully");
      } else {
        throw new Error("Failed to download file");
      }
    } catch {
      toast.error("Failed to download file. Please try again.");
    }
  };

  const handleDeleteFile = async (filename: string) => {
    setFileToDelete(filename);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filenames: [fileToDelete],
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove deleted file from local state
        setLocalFiles((prev) =>
          prev.filter((file) => file.name !== fileToDelete)
        );
        toast.success("File deleted successfully");
      } else {
        throw new Error(result.error || "Failed to delete file");
      }
    } catch {
      toast.error("Failed to delete file. Please try again.");
    } finally {
      setFileToDelete(null);
      setIsLoading(false);
    }
  };

  const handleViewFileDetails = (file: FileData) => {
    setShowFileDetails(file);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Search and Filters */}
      <SearchAndFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFiles={selectedFiles}
        onBulkDelete={handleBulkDelete}
        isLoading={isLoading}
      />

      {/* Statistics Grid */}
      <StatisticsGrid files={localFiles} />

      {/* Files Table */}
      <FilesTable
        filteredFiles={filteredFiles}
        selectedFiles={selectedFiles}
        onFileSelect={handleFileSelect}
        onSelectAll={handleSelectAll}
        onViewFileDetails={handleViewFileDetails}
        onDownloadFile={handleDownloadFile}
        onDeleteFile={handleDeleteFile}
      />

      {/* File Details Modal */}
      <FileDetailsModal
        file={showFileDetails}
        onClose={() => setShowFileDetails(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        fileToDelete={fileToDelete}
        onConfirm={confirmDeleteFile}
        onCancel={() => setFileToDelete(null)}
        isLoading={isLoading}
      />
    </motion.div>
  );
}
