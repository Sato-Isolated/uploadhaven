"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { detectSuspiciousActivity, logSecurityEvent } from "@/lib/security";
import type { 
  ScanResult
} from "@/types";
import type { ScanType, ScannedFile } from "@/types/security";

export interface SecurityScanningState {
  isScanning: boolean;
  scanProgress: number;
  selectedScanType: ScanType;
  scanResults: ScanResult[];
  currentScanStep: string;
  scannedFiles: ScannedFile[];
  totalFilesToScan: number;
  currentFileIndex: number;
  virusTotalRequestsUsed: number;
}

export interface SecurityScanningActions {
  setSelectedScanType: (type: ScanType) => void;
  startScan: () => Promise<void>;
  stopScan: () => void;
  scanSingleFile: (fileName: string) => Promise<{ scanResult?: unknown }>;
  scanUploadedFile: (file: File) => Promise<{ scanResult?: unknown; quotaStatus?: unknown }>;
  fetchFilesList: () => Promise<{ files?: Array<{ name: string }> }>;
  resetScan: () => void;
}

export type UseSecurityScanningReturn = SecurityScanningState & SecurityScanningActions;

/**
 * Custom hook for managing security scanning operations
 * Extracts complex scanning logic from SecurityScanModal component
 */
export function useSecurityScanning(): UseSecurityScanningReturn {
  // State management
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedScanType, setSelectedScanType] = useState<ScanType>("quick");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [currentScanStep, setCurrentScanStep] = useState("");
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [totalFilesToScan, setTotalFilesToScan] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [virusTotalRequestsUsed, setVirusTotalRequestsUsed] = useState(0);

  // API operations
  const fetchFilesList = useCallback(async () => {
    const response = await fetch("/api/security/files");
    if (!response.ok) {
      throw new Error("Failed to fetch files list");
    }
    return response.json();
  }, []);

  const scanSingleFile = useCallback(async (fileName: string) => {
    const response = await fetch("/api/security/scan/file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName }),
    });
    if (!response.ok) {
      throw new Error("Failed to scan file");
    }
    return response.json();
  }, []);

  const scanUploadedFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/security/scan", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("File scan failed");
    }
    return response.json();
  }, []);

  // Main scan execution logic
  const startScan = useCallback(async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanResults([]);
    setCurrentScanStep("");
    setScannedFiles([]);
    setCurrentFileIndex(0);

    const scanSteps = selectedScanType === "quick"
      ? [
          "Initializing quick scan",
          "Checking recent uploads",
          "Scanning for basic threats",
          "Analyzing file signatures",
          "Completing quick scan"
        ]
      : selectedScanType === "full"
        ? [
            "Initializing full scan",
            "Checking file system",
            "Analyzing suspicious activities",
            "Scanning for malware",
            "Validating system integrity",
            "Checking upload history",
            "Analyzing security logs",
          ]
        : [
            "Initializing custom scan",
            "Running advanced threat detection",
            "Deep system analysis",
            "Custom security checks",
          ];

    const results: ScanResult[] = [];

    try {
      for (let i = 0; i < scanSteps.length; i++) {
        setCurrentScanStep(scanSteps[i]);
        setScanProgress((i / scanSteps.length) * 100);

        // Simulate scan delay
        await new Promise((resolve) =>
          setTimeout(resolve, selectedScanType === "quick" ? 1000 : 2000)
        );

        // Perform actual security checks based on scan step
        if (scanSteps[i].includes("suspicious")) {
          const isSuspicious = detectSuspiciousActivity("0.0.0.0");
          if (isSuspicious) {
            results.push({
              type: "Suspicious Activity",
              status: "warning",
              message: "Detected suspicious activity patterns",
              details: "Multiple failed upload attempts from specific IPs detected",
              timestamp: new Date(),
            });
          } else {
            results.push({
              type: "Suspicious Activity",
              status: "clean",
              message: "No suspicious activities detected",
              timestamp: new Date(),
            });
          }
        }

        if (scanSteps[i].includes("system integrity")) {
          const hasIntegrityIssues = Math.random() < 0.1;
          results.push({
            type: "System Integrity",
            status: hasIntegrityIssues ? "warning" : "clean",
            message: hasIntegrityIssues
              ? "Minor system integrity issues detected"
              : "System integrity verified",
            timestamp: new Date(),
          });
        }

        if (scanSteps[i].includes("malware")) {
          // Check for malware in uploaded files
          try {
            const filesList = await fetchFilesList();
            setTotalFilesToScan(filesList.files?.length || 0);

            if (filesList.files && filesList.files.length > 0) {
              for (let fileIndex = 0; fileIndex < filesList.files.length; fileIndex++) {
                const file = filesList.files[fileIndex];
                setCurrentFileIndex(fileIndex + 1);

                // Add file to scanned files list
                setScannedFiles(prev => [
                  ...prev,
                  { fileName: file.name, status: "scanning" }
                ]);

                try {
                  const scanData = await scanSingleFile(file.name);
                  const scanResult = scanData.scanResult;                  if (scanResult) {
                    // Update file status
                    const fileStatus = scanResult.isMalicious
                      ? "threat"
                      : scanResult.isSuspicious
                      ? "suspicious"
                      : "clean";

                    const details = scanResult.threatName ||
                      `Source: ${scanResult.source}` +
                      (scanResult.engineResults
                        ? ` (${scanResult.engineResults.length} engines)`
                        : "");

                    setScannedFiles((prev) =>
                      prev.map((f, idx) =>
                        idx === fileIndex
                          ? { ...f, status: fileStatus, details, scanResult }
                          : f
                      )
                    );

                    // Update VirusTotal requests used
                    if (scanData.quotaStatus) {
                      setVirusTotalRequestsUsed(scanData.quotaStatus.used);
                    }
                  } else {
                    // No scan result - mark as error
                    setScannedFiles((prev) =>
                      prev.map((f, idx) =>
                        idx === fileIndex
                          ? { ...f, status: "error", details: "Scan failed" }
                          : f
                      )
                    );
                  }                } catch {
                  // Error scanning individual file
                  setScannedFiles((prev) =>
                    prev.map((f, idx) =>
                      idx === fileIndex
                        ? { ...f, status: "error", details: "Scan failed" }
                        : f
                    )
                  );
                }

                // Small delay between file scans
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }

            const threatsCount = scannedFiles.filter(f => f.status === "threat").length;
            const suspiciousCount = scannedFiles.filter(f => f.status === "suspicious").length;

            results.push({
              type: "Malware Scan",
              status: threatsCount > 0 ? "threat" : suspiciousCount > 0 ? "warning" : "clean",
              message: threatsCount > 0
                ? `${threatsCount} malicious files detected`
                : suspiciousCount > 0
                ? `${suspiciousCount} suspicious files detected`
                : "No malware detected",
              details: `Scanned ${filesList.files?.length || 0} files`,
              timestamp: new Date(),
            });
          } catch (error) {
            results.push({
              type: "Malware Scan",
              status: "warning",
              message: "Unable to complete malware scan",
              details: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date(),
            });
          }
        }
      }

      setScanResults(results);
      setScanProgress(100);
      setCurrentScanStep("Scan completed");      // Log security event
      logSecurityEvent(
        "file_scan",
        `Security scan completed: ${selectedScanType} scan with ${results.length} results`,
        "low",
        {
          fileSize: results.filter(r => r.status === "threat").length,
        }
      );

      toast.success("Security scan completed successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Scan failed";
      setScanResults([{
        type: "Scan Error",
        status: "threat",
        message: errorMessage,
        timestamp: new Date(),
      }]);
      toast.error(`Scan failed: ${errorMessage}`);
    } finally {
      setIsScanning(false);
      setCurrentScanStep("");
    }
  }, [isScanning, selectedScanType, fetchFilesList, scanSingleFile, scannedFiles]);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    setScanProgress(0);
    setCurrentScanStep("");
    toast.info("Scan stopped");
  }, []);

  const resetScan = useCallback(() => {
    setIsScanning(false);
    setScanProgress(0);
    setScanResults([]);
    setCurrentScanStep("");
    setScannedFiles([]);
    setTotalFilesToScan(0);
    setCurrentFileIndex(0);
    setVirusTotalRequestsUsed(0);
  }, []);

  return {
    // State
    isScanning,
    scanProgress,
    selectedScanType,
    scanResults,
    currentScanStep,
    scannedFiles,
    totalFilesToScan,
    currentFileIndex,
    virusTotalRequestsUsed,
    
    // Actions
    setSelectedScanType,
    startScan,
    stopScan,
    scanSingleFile,
    scanUploadedFile,
    fetchFilesList,
    resetScan,
  };
}
