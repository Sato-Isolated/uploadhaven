"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { MalwareScanResult } from "@/types/security";

interface FileScanResult {
  fileName: string;
  fileSize: number;
  scanResult: MalwareScanResult;
  scannedAt: string;
}

interface FileScannerProps {
  isFileScanning: boolean;
  fileScanResults: FileScanResult[];
  onFileScan: (file: File) => void;
}

export function FileScanner({ 
  isFileScanning, 
  fileScanResults, 
  onFileScan 
}: FileScannerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          File Scanner
        </CardTitle>
        <CardDescription>
          Upload and scan files for malware and threats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-scan-input"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onFileScan(file);
                }
              }}
              disabled={isFileScanning}
            />
            <label
              htmlFor="file-scan-input"
              className={`cursor-pointer ${
                isFileScanning ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              <div className="space-y-2">
                <FileText className="w-8 h-8 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isFileScanning
                    ? "Scanning file..."
                    : "Click to select a file to scan"}
                </p>
                <p className="text-xs text-gray-500">
                  Supports all file types • Max 10MB
                </p>
              </div>
            </label>
          </div>

          {fileScanResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Recent File Scans</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {fileScanResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.scanResult.isMalicious ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : result.scanResult.isSuspicious ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{result.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(result.fileSize / 1024).toFixed(1)} KB • {result.scanResult.source}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        result.scanResult.isMalicious
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          : result.scanResult.isSuspicious
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      }
                    >
                      {result.scanResult.isMalicious
                        ? "Threat"
                        : result.scanResult.isSuspicious
                        ? "Suspicious"
                        : "Clean"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
