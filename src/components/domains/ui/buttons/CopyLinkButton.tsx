"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CopyLinkButtonProps {
  filename: string;
  className?: string;
}

export default function CopyLinkButton({ filename, className }: CopyLinkButtonProps) {
  const handleCopyLink = () => {
    const link = `${window.location.origin}/api/files/${filename}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopyLink}
      className={className}
    >
      Copy Link
    </Button>
  );
}
