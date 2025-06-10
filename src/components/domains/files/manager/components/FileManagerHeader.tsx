// FileManagerHeader.tsx - Header component for FileManager with title and statistics

"use client";

import { motion } from "motion/react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import type { FileManagerHeaderProps } from "../types";

export default function FileManagerHeader({
  filesCount,
  totalSize,
}: FileManagerHeaderProps) {
  return (
    <CardHeader className="pb-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">File Manager</CardTitle>
              <CardDescription className="text-base">
                Manage your uploaded files ({filesCount} file
                {filesCount !== 1 ? "s" : ""})
              </CardDescription>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-right"
          >
            <div className="text-sm text-muted-foreground">
              Total Size: {formatFileSize(totalSize)}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </CardHeader>
  );
}
