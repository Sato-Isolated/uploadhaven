// components/FileActions.tsx - File action buttons and status badges

"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Link2, Copy, X } from "lucide-react";
import FileStatusBadge from "./FileStatusBadge";
import type { FileHandlerProps } from "@/components/types/common";

interface FileActionsProps extends FileHandlerProps {
  onRemoveFile: (id: string) => void;
  onCopyToClipboard: (url: string, label?: string) => void;
}

export default function FileActions({
  file,
  onRemoveFile,
  onCopyToClipboard,
}: FileActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <AnimatePresence mode="wait">
        {/* Status Badge */}
        <FileStatusBadge
          key={`status-${file.id}`}
          status={file.status}
          threatDetails={file.error}
        />
        {/* Completed state action buttons */}
        {file.status === "completed" && file.shortUrl && (
          <motion.div
            key={`short-url-${file.id}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="sm"
              variant="default"
              onClick={() => onCopyToClipboard(file.shortUrl!, "Short URL")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Link2 className="h-3 w-3 mr-1" />
              Copy Link
            </Button>
          </motion.div>
        )}
        {file.status === "completed" && file.url && (
          <motion.div
            key={`direct-url-${file.id}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopyToClipboard(file.url!, "Direct URL")}
              className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
            >
              <Copy className="h-3 w-3 mr-1" />
              Direct
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Remove button */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemoveFile(file.id)}
          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
        >
          <X className="h-3 w-3" />
        </Button>
      </motion.div>
    </div>
  );
}
