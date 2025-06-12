// FileActionButtons.tsx - Action buttons component for file operations

'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Trash2, Eye } from 'lucide-react';
import type { FileActionButtonsProps } from '../types';

export default function FileActionButtons({
  onPreview,
  onCopyLink,
  onDownload,
  onDelete,
}: FileActionButtonsProps) {
  return (
    <motion.div
      className="flex items-center space-x-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="h-10 w-10 p-0 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopyLink}
          className="h-10 w-10 p-0 text-green-600 transition-colors hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-950"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownload}
          className="h-10 w-10 p-0 text-purple-600 transition-colors hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-950"
        >
          <Download className="h-4 w-4" />
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-10 w-10 p-0 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
