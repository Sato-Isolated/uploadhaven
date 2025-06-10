import React from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserCog, Mail, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAction: (
    action: "delete" | "toggleRole" | "resendVerification"
  ) => void;
}

export default function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkAction,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex items-center gap-4">
        <Badge variant="secondary" className="flex items-center gap-2">
          {selectedCount} selected
        </Badge>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkAction("resendVerification")}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Resend Verification
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkAction("toggleRole")}
            className="flex items-center gap-2"
          >
            <UserCog className="h-4 w-4" />
            Toggle Role
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onBulkAction("delete")}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
