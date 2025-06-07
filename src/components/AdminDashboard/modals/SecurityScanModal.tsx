"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SecurityPanel from "@/components/SecurityPanel";

interface SecurityScanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SecurityScanModal({
  isOpen,
  onOpenChange,
}: SecurityScanModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Security Dashboard</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[75vh] pr-2">
          <SecurityPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
