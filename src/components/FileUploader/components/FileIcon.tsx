"use client";

import { motion } from "motion/react";
import { File } from "lucide-react";
import type {
  FileStatusProps,
  FileUploadStatus,
} from "@/components/types/common";

interface FileIconProps extends Pick<FileStatusProps, "status"> {}

export default function FileIcon({ status }: FileIconProps) {
  const getIconStyles = (status: FileUploadStatus) => {
    if (status === "completed") {
      return {
        containerClass: "bg-green-100 dark:bg-green-900",
        iconClass: "text-green-600",
      };
    }
    if (status === "error" || status === "threat_detected") {
      return {
        containerClass: "bg-red-100 dark:bg-red-900",
        iconClass: "text-red-600",
      };
    }
    return {
      containerClass: "bg-blue-100 dark:bg-blue-900",
      iconClass: "text-blue-600",
    };
  };

  const { containerClass, iconClass } = getIconStyles(status);
  const isAnimating = status === "scanning" || status === "uploading";

  return (
    <motion.div
      className={`p-2 rounded-lg ${containerClass}`}
      animate={{
        rotate: isAnimating ? 360 : 0,
      }}
      transition={{
        rotate: {
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        },
      }}
    >
      <File className={`h-5 w-5 ${iconClass}`} />
    </motion.div>
  );
}
