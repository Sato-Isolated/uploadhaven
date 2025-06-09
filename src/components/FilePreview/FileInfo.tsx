"use client";

import { motion } from "motion/react";
import { formatFileSize } from "@/lib/utils";
import type { FileInfoProps } from "@/components/types/common";

interface FileInfoPropsLocal extends FileInfoProps {}

export default function FileInfo({ file }: FileInfoPropsLocal) {
  const infoItems = [
    { label: "Type:", value: file.type || "Unknown" },
    { label: "Size:", value: formatFileSize(file.size) },
    { label: "Filename:", value: file.filename },
  ];

  return (
    <motion.div
      className="grid grid-cols-3 gap-4 text-sm border-b pb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      {infoItems.map((info, index) => (
        <motion.div
          key={info.label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
        >
          <span className="text-muted-foreground">{info.label}</span>
          {info.value}
        </motion.div>
      ))}
    </motion.div>
  );
}
