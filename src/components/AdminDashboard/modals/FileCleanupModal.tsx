"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminFileManager from "@/components/AdminFileManager";
import type { FileData } from "../types";

interface FileCleanupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileData[];
  loading: boolean;
}

export default function FileCleanupModal({
  isOpen,
  onOpenChange,
  files,
  loading,
}: FileCleanupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>File Cleanup</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[75vh] pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading files...
              </div>
            </div>
          ) : (
            <AdminFileManager files={files} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
