import { useMemo } from "react";
import type { AdminFileData } from "@/types";

export interface UseFilesTableLogicReturn {
  // Selection state
  isAllSelected: boolean;
  isIndeterminate: boolean;
  hasSelectedFiles: boolean;
  selectedCount: number;
  
  // Handlers (passed through from props)
  onFileSelect: (fileId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewFileDetails: (file: AdminFileData) => void;
  onDownloadFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

interface UseFilesTableLogicProps {
  filteredFiles: AdminFileData[];
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewFileDetails: (file: AdminFileData) => void;
  onDownloadFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

export function useFilesTableLogic({
  filteredFiles,
  selectedFiles,
  onFileSelect,
  onSelectAll,
  onViewFileDetails,
  onDownloadFile,
  onDeleteFile,
}: UseFilesTableLogicProps): UseFilesTableLogicReturn {
  
  // Derived selection state
  const selectionState = useMemo(() => {
    const totalFiles = filteredFiles.length;
    const selectedCount = selectedFiles.length;
    
    return {
      isAllSelected: selectedCount === totalFiles && totalFiles > 0,
      isIndeterminate: selectedCount > 0 && selectedCount < totalFiles,
      hasSelectedFiles: selectedCount > 0,
      selectedCount,
    };
  }, [filteredFiles.length, selectedFiles.length]);

  return {
    // Selection state
    ...selectionState,
    
    // Handlers (pass through)
    onFileSelect,
    onSelectAll,
    onViewFileDetails,
    onDownloadFile,
    onDeleteFile,
  };
}
