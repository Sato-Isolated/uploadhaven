'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ScanTypeSelector,
  ScanProgress,
  ScanResults,
  ScannedFilesList,
  FileScanner,
  ScanHistory,
  QuotaStatusDisplay,
} from '@/components/domains/security/scanning';
import { useSecurityScanModal } from './hooks/useSecurityScanModal';

interface SecurityScanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SecurityScanModal({
  isOpen,
  onOpenChange,
}: SecurityScanModalProps) {
  // Extract all business logic to custom hook
  const {
    // Security scanning state
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

    // Modal-specific state
    quotaStatus,
    virusTotalConfigured,
    fileScanResults,
    isFileScanning,
    scanHistory,

    // Actions
    startScan,
    handleFileScan,
  } = useSecurityScanModal(isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Security Scan Center
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scan Type Selection */}
          <ScanTypeSelector
            selectedScanType={selectedScanType}
            onScanTypeChange={setSelectedScanType}
            disabled={isScanning}
          />
          {/* VirusTotal Quota Status */}
          <QuotaStatusDisplay
            quotaStatus={quotaStatus}
            virusTotalConfigured={virusTotalConfigured}
          />
          {/* File Scanner */}
          <FileScanner
            isFileScanning={isFileScanning}
            fileScanResults={fileScanResults}
            onFileScan={handleFileScan}
          />
          {/* Scan Progress and Control */}
          <ScanProgress
            isScanning={isScanning}
            scanProgress={scanProgress}
            currentScanStep={currentScanStep}
            selectedScanType={selectedScanType}
            virusTotalConfigured={virusTotalConfigured}
            virusTotalRequestsUsed={virusTotalRequestsUsed}
            quotaStatus={quotaStatus}
            onStartScan={startScan}
            onStopScan={stopScan}
          />
          {/* Scanned Files Progress (shows during scanning) */}
          {isScanning && (
            <ScannedFilesList
              scannedFiles={scannedFiles}
              currentFileIndex={currentFileIndex}
              totalFilesToScan={totalFilesToScan}
            />
          )}
          {/* Scan Results */}
          <ScanResults scanResults={scanResults} />
          {/* Scan History */}
          <ScanHistory scanHistory={scanHistory} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
