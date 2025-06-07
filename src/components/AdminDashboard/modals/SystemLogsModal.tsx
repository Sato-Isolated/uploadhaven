"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RecentActivity from "@/components/RecentActivity";

interface SystemLogsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SystemLogsModal({
  isOpen,
  onOpenChange,
}: SystemLogsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>System Logs</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[75vh] pr-2">
          <RecentActivity />
        </div>
      </DialogContent>
    </Dialog>
  );
}
