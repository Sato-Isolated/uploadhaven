// FilesList.tsx - List component for rendering files (SRP)

'use client';

import { motion, AnimatePresence } from 'motion/react';
import FilesListItem from './FilesListItem';
import type { FilesListProps } from './types';

/**
 * FilesList - List component for rendering file items
 * Responsibilities:
 * - Rendering scrollable list of files with animations
 * - Managing list animations (enter/exit)
 * - Passing through actions to individual items
 */
export default function FilesList({
  files,
  onDelete,
  deleteLoading = false,
}: FilesListProps) {return (
    <motion.div
      className="space-y-4 pb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <AnimatePresence mode="popLayout">        {files.map((file, index) => (
          <FilesListItem
            key={file.id}
            file={file}
            index={index}
            onDelete={onDelete}
            deleteLoading={deleteLoading}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
