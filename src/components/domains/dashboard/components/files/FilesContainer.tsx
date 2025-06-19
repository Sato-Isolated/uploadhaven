// FilesContainer.tsx - Layout container for files management (SRP)

'use client';

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import FilesHeader from './FilesHeader';
import type { FilesContainerProps } from './types';

/**
 * FilesContainer - Layout container component
 * Responsibilities:
 * - Providing consistent layout structure with scrollable content
 * - Managing animations
 * - Rendering header and scrollable content areas
 */
export default function FilesContainer({
  files,
  totalSize,
  onRefresh,
  children,
}: FilesContainerProps) {  return (
    <motion.div
      className="w-full max-w-4xl mx-auto flex flex-col h-[690px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-lg dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 flex flex-col h-full">
        <FilesHeader
          filesCount={files.length}
          totalSize={totalSize}
          onRefresh={onRefresh}
        />
        <CardContent className="flex-1 overflow-hidden p-6">
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:hover:scrollbar-thumb-gray-500">
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
