"use client";

import { motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFileSize } from "@/lib/utils";
import type { AdminFileData } from "@/types";
import { formatDate, getFileTypeIcon } from "../utils";

interface FileDetailsModalProps {
  file: AdminFileData | null;
  onClose: () => void;
}

export default function FileDetailsModal({
  file,
  onClose,
}: FileDetailsModalProps) {
  if (!file) return null;

  const fileDetails = [
    {
      label: "Original Name",
      value: file.originalName,
    },
    {
      label: "System Name",
      value: file.name,
      mono: true,
    },
    {
      label: "Size",
      value: formatFileSize(file.size),
    },
    {
      label: "Type",
      value: file.mimeType,
    },
    {
      label: "Upload Date",
      value: formatDate(file.uploadDate),
    },
    {
      label: "Downloads",
      value: file.downloadCount.toString(),
    },
    {
      label: "Owner",
      value: file.isAnonymous ? "Anonymous" : file.userName || "Unknown",
    },
    {
      label: "File ID",
      value: file.id,
      mono: true,
    },
  ];

  return (
    <Dialog open={file !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <motion.div
              className="text-2xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {getFileTypeIcon(file.mimeType)}
            </motion.div>
            File Details
          </DialogTitle>
          <DialogDescription>
            Complete information about the selected file
          </DialogDescription>
        </DialogHeader>
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {fileDetails.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
            >
              <strong className="text-sm text-gray-700 dark:text-gray-300 block mb-1">
                {item.label}:
              </strong>
              <p
                className={`text-sm text-gray-600 dark:text-gray-400 ${
                  item.mono
                    ? "font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                    : ""
                }`}
              >
                {item.value}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
