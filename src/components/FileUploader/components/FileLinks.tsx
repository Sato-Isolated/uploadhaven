// components/FileLinks.tsx - File sharing links and actions

"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Link2, Copy, ExternalLink, Shield, File } from "lucide-react";
import type { UploadedFile } from "../types";

interface FileLinksProps {
  file: UploadedFile;
  onCopyToClipboard: (url: string, label?: string) => void;
}

export default function FileLinks({ file, onCopyToClipboard }: FileLinksProps) {
  // Only show links for completed files
  if (
    file.status !== "completed" ||
    (!file.shortUrl && !file.url && !file.generatedKey)
  ) {
    return null;
  }

  return (
    <motion.div
      className="mt-3 space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      {/* Generated Key */}
      {file.generatedKey && (
        <motion.div
          className="flex items-center space-x-2 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg dark:from-yellow-950/20 dark:to-amber-950/20 dark:border-yellow-800"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
          }}
        >
          <Shield className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <span className="text-sm font-mono text-yellow-800 dark:text-yellow-200 flex-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
            🔑 {file.generatedKey}
          </span>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                onCopyToClipboard(file.generatedKey!, "Generated key")
              }
              className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Short URL */}
      {file.shortUrl && (
        <motion.div
          className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg dark:bg-blue-950/20"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Link2 className="h-3 w-3 text-primary flex-shrink-0" />
          <a
            href={file.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline font-medium flex-1 truncate"
          >
            🔗 {file.shortUrl.replace(/^https?:\/\//, "")}
          </a>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(file.shortUrl!, "_blank")}
              className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Direct URL indicator */}
      {file.url && file.shortUrl && (
        <motion.div
          className="flex items-center space-x-2 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <File className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            Direct: {file.url.replace(/^https?:\/\//, "").substring(0, 40)}
            ...
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
