"use client";

import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { handleFileDownload, handleFileOpenInNewTab } from "./utils";
import type { FilePreviewData, BaseComponentProps } from "@/types";

interface FileActionsProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function FileActions({ file }: FileActionsProps) {
  return (
    <div className="flex gap-2 justify-end pt-4 border-t">
      <Button variant="outline" onClick={() => handleFileOpenInNewTab(file)}>
        <ExternalLink className="w-4 h-4 mr-2" />
        Open in New Tab
      </Button>
      <Button onClick={() => handleFileDownload(file)}>
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>
    </div>
  );
}
