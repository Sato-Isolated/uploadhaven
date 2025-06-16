import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { formatFileSize } from '@/lib/core/utils';
import { formatDate } from '@/components/domains/admin/filemanager/utils';
import { FilesTableFileCell } from './FilesTableFileCell';
import { FilesTableOwnerCell } from './FilesTableOwnerCell';
import { FilesTableActions } from './FilesTableActions';
import type { AdminFileData } from '@/types';

interface FilesTableRowProps {
  file: AdminFileData;
  index: number;
  isSelected: boolean;
  onFileSelect: (fileId: string) => void;
  onViewFileDetails: (file: AdminFileData) => void;
  onDownloadFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

export function FilesTableRow({
  file,
  index,
  isSelected,
  onFileSelect,
  onViewFileDetails,
  onDownloadFile,
  onDeleteFile,
}: FilesTableRowProps) {
  return (
    <motion.tr
      key={file.id}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className="border-b border-gray-200/30 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:border-gray-700/30 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20"
      whileHover={{ scale: 1.01, y: -1 }}
    >
      {/* Checkbox Cell */}
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onFileSelect(file.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>

      {/* File Cell */}
      <td className="p-4">
        <FilesTableFileCell
          originalName={file.originalName}
          filename={file.name}
          mimeType={file.mimeType}
        />
      </td>

      {/* Size Cell */}
      <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        {formatFileSize(file.size)}
      </td>

      {/* Type Cell */}
      <td className="p-4">
        <Badge
          variant="outline"
          className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 text-xs font-semibold dark:border-blue-700 dark:from-blue-950 dark:to-purple-950"
        >
          {file.mimeType.split('/')[1]?.toUpperCase() || 'Unknown'}
        </Badge>
      </td>

      {/* Owner Cell */}
      <td className="p-4">
        <FilesTableOwnerCell
          isAnonymous={file.isAnonymous}
          userName={file.userName}
        />
      </td>

      {/* Upload Date Cell */}
      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
        {formatDate(file.uploadDate)}
      </td>

      {/* Downloads Cell */}
      <td className="p-4">
        <motion.div
          className="flex items-center gap-1"
          whileHover={{ scale: 1.05 }}
        >
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {file.downloadCount}
          </span>
        </motion.div>
      </td>

      {/* Actions Cell */}
      <td className="p-4">
        <FilesTableActions
          file={file}
          onViewFileDetails={onViewFileDetails}
          onDownloadFile={onDownloadFile}
          onDeleteFile={onDeleteFile}
        />
      </td>
    </motion.tr>
  );
}
