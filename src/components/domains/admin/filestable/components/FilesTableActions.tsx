import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Download, Trash2, MoreHorizontal } from "lucide-react";
import type { AdminFileData } from "@/types";

interface FilesTableActionsProps {
  file: AdminFileData;
  onViewFileDetails: (file: AdminFileData) => void;
  onDownloadFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

export function FilesTableActions({
  file,
  onViewFileDetails,
  onDownloadFile,
  onDeleteFile,
}: FilesTableActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60"
      >
        <DropdownMenuItem
          onClick={() => onViewFileDetails(file)}
          className="hover:bg-blue-50 dark:hover:bg-blue-950/50"
        >
          <Eye className="h-4 w-4 mr-2 text-blue-600" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDownloadFile(file.name)}
          className="hover:bg-green-50 dark:hover:bg-green-950/50"
        >
          <Download className="h-4 w-4 mr-2 text-green-600" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
          onClick={() => onDeleteFile(file.name)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
