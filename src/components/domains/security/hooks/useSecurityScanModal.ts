"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSecurityScan } from "@/hooks";
import { useSecurityScanning } from "@/hooks/useSecurityScanning";
import type { QuotaStatus, MalwareScanResult } from "@/types/security";

interface FileScanResult {
  fileName: string;
  fileSize: number;
  scanResult: MalwareScanResult;
  scannedAt: string;
}

interface ScanHistoryEntry {
  date: Date;
  type: string;
  results: number;
  threats: number;
}

export interface UseSecurityScanModalReturn {
  // Security scanning state and actions
  isScanning: boolean;
  scanProgress: number;
  selectedScanType: string;
  scanResults: any[];
  currentScanStep: string;
  scannedFiles: any[];
  totalFilesToScan: number;
  currentFileIndex: number;
  virusTotalRequestsUsed: number;
  setSelectedScanType: (type: string) => void;
  stopScan: () => void;
  resetScan: () => void;
  
  // Modal-specific state
  quotaStatus: QuotaStatus | null;
  virusTotalConfigured: boolean;
  fileScanResults: FileScanResult[];
  isFileScanning: boolean;
  scanHistory: ScanHistoryEntry[];
  
  // Actions
  startScan: () => Promise<void>;
  handleFileScan: (file: File) => Promise<void>;
}

/**
 * Custom hook for SecurityScanModal business logic
 * Orchestrates security scanning operations and modal-specific state
 */
export function useSecurityScanModal(isOpen: boolean): UseSecurityScanModalReturn {
  // Local modal state
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [virusTotalConfigured, setVirusTotalConfigured] = useState<boolean>(false);
  const [fileScanResults, setFileScanResults] = useState<FileScanResult[]>([]);
  const [isFileScanning, setIsFileScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);

  // Security scanning hook - contains most business logic
  const {
    isScanning,
    scanProgress,
    selectedScanType,
    scanResults,
    currentScanStep,
    scannedFiles,
    totalFilesToScan,
    currentFileIndex,
    virusTotalRequestsUsed,
    setSelectedScanType,
    startScan: hookStartScan,
    stopScan,
    scanUploadedFile,
    resetScan,
  } = useSecurityScanning();

  // TanStack Query for security data
  const { data: securityData } = useSecurityScan({
    enabled: isOpen,
  });

  // Handle security data when available
  useEffect(() => {
    if (securityData) {
      setVirusTotalConfigured(securityData.virusTotalConfigured);
      if (securityData.quotaStatus) {
        setQuotaStatus(securityData.quotaStatus);
      }
    }
  }, [securityData]);

  // Enhanced start scan function with history tracking
  const startScan = useCallback(async () => {
    try {
      await hookStartScan();
      
      // Update scan history
      const threatsFound = scanResults.filter((r) => r.status === "threat").length;
      const newScanEntry: ScanHistoryEntry = {
        date: new Date(),
        type: selectedScanType,
        results: scanResults.length,
        threats: threatsFound,
      };
      setScanHistory((prev) => [newScanEntry, ...prev.slice(0, 4)]);
      
      toast.success("Security scan completed successfully");
    } catch (error) {
      toast.error("Security scan failed");
      console.error("Scan error:", error);
    }
  }, [hookStartScan, scanResults, selectedScanType]);

  // File scanning handler with validation and feedback
  const handleFileScan = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsFileScanning(true);
    try {
      const scanData = await scanUploadedFile(file);
      
      if (scanData.scanResult) {
        const newResult: FileScanResult = {
          fileName: file.name,
          fileSize: file.size,
          scanResult: scanData.scanResult,
          scannedAt: new Date().toISOString(),
        };
        
        setFileScanResults((prev) => [newResult, ...prev.slice(0, 9)]);
        
        // Provide user feedback based on scan results
        if (scanData.scanResult.isMalicious) {
          toast.error(`Threat detected in ${file.name}`);
        } else if (scanData.scanResult.isSuspicious) {
          toast.warning(`Suspicious file: ${file.name}`);
        } else {
          toast.success(`File ${file.name} is clean`);
        }
        
        // Update quota if provided
        if (scanData.quotaStatus) {
          setQuotaStatus(scanData.quotaStatus);
        }
      }
    } catch (error) {
      toast.error("File scan failed");
      console.error("File scan error:", error);
    } finally {
      setIsFileScanning(false);
    }
  }, [scanUploadedFile]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      resetScan();
    }
  }, [isOpen, resetScan]);

  return {
    // Security scanning state and actions
    isScanning,
    scanProgress,
    selectedScanType,
    scanResults,
    currentScanStep,
    scannedFiles,
    totalFilesToScan,
    currentFileIndex,
    virusTotalRequestsUsed,
    setSelectedScanType,
    stopScan,
    resetScan,
    
    // Modal-specific state
    quotaStatus,
    virusTotalConfigured,
    fileScanResults,
    isFileScanning,
    scanHistory,
    
    // Actions
    startScan,
    handleFileScan,
  };
}
