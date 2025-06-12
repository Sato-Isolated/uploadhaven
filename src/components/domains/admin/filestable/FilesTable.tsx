'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { useFilesTableLogic } from './hooks/useFilesTableLogic';
import { FilesTableHeader } from './components/FilesTableHeader';
import { FilesTableRow } from './components/FilesTableRow';
import { FilesTableEmptyState } from './components/FilesTableEmptyState';
import type { AdminFileData } from '@/types';

interface FilesTableProps {
  filteredFiles: AdminFileData[];
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewFileDetails: (file: AdminFileData) => void;
  onDownloadFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

export default function FilesTable(props: FilesTableProps) {
  const {
    isAllSelected,
    onFileSelect,
    onSelectAll,
    onViewFileDetails,
    onDownloadFile,
    onDeleteFile,
  } = useFilesTableLogic(props);

  const { filteredFiles, selectedFiles } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <Card className="border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-xl backdrop-blur-sm dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        <FilesTableHeader
          totalFiles={filteredFiles.length}
          isAllSelected={isAllSelected}
          onSelectAll={onSelectAll}
        />

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredFiles.map((file, index) => (
                    <FilesTableRow
                      key={file.id}
                      file={file}
                      index={index}
                      isSelected={selectedFiles.includes(file.id)}
                      onFileSelect={onFileSelect}
                      onViewFileDetails={onViewFileDetails}
                      onDownloadFile={onDownloadFile}
                      onDeleteFile={onDeleteFile}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredFiles.length === 0 && <FilesTableEmptyState />}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
