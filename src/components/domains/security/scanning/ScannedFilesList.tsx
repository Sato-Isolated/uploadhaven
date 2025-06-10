"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ScannedFile } from "@/types/security";

interface ScannedFilesListProps {
  scannedFiles: ScannedFile[];
  currentFileIndex: number;
  totalFilesToScan: number;
}

interface ScannedFileItemProps {
  file: ScannedFile;
}

function ScannedFileItem({ file }: ScannedFileItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasEngineResults =
    file.scanResult?.engineResults && file.scanResult.engineResults.length > 0;

  return (
    <motion.div
      className="bg-gray-50 dark:bg-gray-800 rounded border"
      initial={{ opacity: 0.5 }}
      animate={{
        opacity: file.status === "scanning" ? [1, 0.5, 1] : 1,
        scale: file.status === "scanning" ? [1, 1.02, 1] : 1,
      }}
      transition={{
        duration: file.status === "scanning" ? 1.5 : 0.3,
        repeat: file.status === "scanning" ? Infinity : 0,
      }}
    >
      {/* Main file info row */}
      <div
        className={`flex items-center justify-between p-2 text-xs ${
          hasEngineResults
            ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            : ""
        }`}
        onClick={() => hasEngineResults && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {file.status === "scanning" ? (
            <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
          ) : file.status === "threat" ? (
            <AlertTriangle className="w-3 h-3 text-red-500" />
          ) : file.status === "suspicious" ? (
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
          ) : file.status === "error" ? (
            <AlertTriangle className="w-3 h-3 text-gray-500" />
          ) : (
            <CheckCircle className="w-3 h-3 text-green-500" />
          )}
          <span className="truncate font-mono">{file.fileName}</span>
          {file.details && file.status !== "scanning" && (
            <span className="text-xs text-gray-400 ml-1">- {file.details}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${
              file.status === "threat"
                ? "border-red-500 text-red-600"
                : file.status === "suspicious"
                ? "border-yellow-500 text-yellow-600"
                : file.status === "error"
                ? "border-gray-500 text-gray-600" 
                : file.status === "scanning"
                ? "border-blue-500 text-blue-600"
                : "border-green-500 text-green-600"
            }`}
          >
            {file.status === "threat"
              ? "Threat"
              : file.status === "suspicious"
              ? "Suspicious"
              : file.status === "error"
              ? "Error"
              : file.status === "scanning"
              ? "Scanning..."
              : "Clean"}
          </Badge>

          {hasEngineResults && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Collapsible detailed results */}
      <AnimatePresence>
        {isExpanded && hasEngineResults && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 dark:border-gray-600 p-3 bg-white dark:bg-gray-900">
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Antivirus Engine Results
                  </span>
                  <span className="text-gray-500">
                    {file.scanResult?.engineResults?.length || 0} engines analyzed
                  </span>
                </div>

                {file.scanResult?.threatName && (
                  <div className="mt-1 text-xs">
                    <span className="font-medium text-red-600">Threat detected:</span>
                    <span className="ml-1 font-mono">{file.scanResult.threatName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 max-h-32 overflow-y-auto">
                {file.scanResult?.engineResults?.map((engine, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1 text-xs bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <span className="font-medium">{engine.engine}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          engine.result === "clean" || engine.result === "undetected"
                            ? "border-green-500 text-green-600"
                            : "border-red-500 text-red-600"
                        }`}
                      >
                        {engine.category || engine.result}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ScannedFilesList({ 
  scannedFiles, 
  currentFileIndex, 
  totalFilesToScan 
}: ScannedFilesListProps) {
  if (scannedFiles.length === 0) return null;

  const completedScans = scannedFiles.filter((f) => f.status !== "scanning").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Scanned Files ({completedScans}/{scannedFiles.length})
        </h4>
        {totalFilesToScan > 0 && (
          <span className="text-xs text-gray-500">
            File {currentFileIndex}/{totalFilesToScan}
          </span>
        )}
      </div>
      <div className="max-h-40 overflow-y-auto space-y-2">
        {scannedFiles.map((file, index) => (
          <ScannedFileItem key={index} file={file} />
        ))}
      </div>
    </div>
  );
}
