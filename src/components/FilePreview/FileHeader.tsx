"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { FileData, FileTypeInfo, getFileTypeDisplay } from "./utils";
import { FileIcon } from "./FileIcon";

interface FileHeaderProps {
  file: FileData;
  typeInfo: FileTypeInfo;
  onClose: () => void;
}

export default function FileHeader({
  file,
  typeInfo,
  onClose,
}: FileHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {" "}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <FileIcon typeInfo={typeInfo} />
        </motion.div>
        <span>{file.originalName}</span>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-0"
          >
            {getFileTypeDisplay(typeInfo)}
          </Badge>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
