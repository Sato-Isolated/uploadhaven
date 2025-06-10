import { motion } from "motion/react";
import { getFileTypeIcon } from "@/components/domains/admin/filemanager/utils";

interface FilesTableFileCellProps {
  originalName: string;
  filename: string;
  mimeType: string;
}

export function FilesTableFileCell({ 
  originalName, 
  filename, 
  mimeType 
}: FilesTableFileCellProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="text-2xl"
        whileHover={{ scale: 1.2, rotate: 10 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {getFileTypeIcon(mimeType)}
      </motion.div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white text-sm">
          {originalName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {filename}
        </p>
      </div>
    </div>
  );
}
