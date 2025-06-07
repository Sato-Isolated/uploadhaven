"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";
import {
  FileText,
  Download,
  Trash2,
  Eye,
  MoreHorizontal,
  User,
  Database,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FileData } from "../types";
import { formatDate, getFileTypeIcon } from "../utils";

interface FilesTableProps {
  filteredFiles: FileData[];
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onViewFileDetails: (file: FileData) => void;
  onDownloadFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
}

export default function FilesTable({
  filteredFiles,
  selectedFiles,
  onFileSelect,
  onSelectAll,
  onViewFileDetails,
  onDownloadFile,
  onDeleteFile,
}: FilesTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg"
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Database className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-xl">All Files</CardTitle>
              <CardDescription className="text-base">
                Manage all uploaded files across the platform (
                {filteredFiles.length} files)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        onSelectAll(e.target.checked);
                      }}
                      checked={
                        selectedFiles.length === filteredFiles.length &&
                        filteredFiles.length > 0
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    File
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Size
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Owner
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Upload Date
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Downloads
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredFiles.map((file, index) => (
                    <motion.tr
                      key={file.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02, duration: 0.3 }}
                      className="border-b border-gray-200/30 dark:border-gray-700/30 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-950/20 dark:hover:to-purple-950/20 transition-all duration-300"
                      whileHover={{ scale: 1.01, y: -1 }}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => onFileSelect(file.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="text-2xl"
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {getFileTypeIcon(file.mimeType)}
                          </motion.div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {file.originalName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {file.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-700"
                        >
                          {file.mimeType.split("/")[1]?.toUpperCase() ||
                            "Unknown"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {file.isAnonymous ? (
                          <Badge
                            variant="secondary"
                            className="text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
                          >
                            Anonymous
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <motion.div
                              className="p-1.5 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full"
                              whileHover={{ scale: 1.1 }}
                            >
                              <User className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </motion.div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {file.userName || "Unknown"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(file.uploadDate)}
                      </td>
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
                      <td className="p-4">
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
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredFiles.length === 0 && (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <motion.div
                  className="relative mx-auto w-20 h-20 mb-6"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-lg">
                    <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No files found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  No files match your search criteria.
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
