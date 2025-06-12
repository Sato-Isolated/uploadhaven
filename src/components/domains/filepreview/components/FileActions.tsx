'use client';

import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { handleFileDownload, handleFileOpenInNewTab } from '../utils';
import type { FilePreviewData, BaseComponentProps } from '@/types';

interface FileActionsProps extends BaseComponentProps {
  file: FilePreviewData;
}

export default function FileActions({ file }: FileActionsProps) {
  return (
    <div className="flex justify-end gap-2 border-t pt-4">
      <Button variant="outline" onClick={() => handleFileOpenInNewTab(file)}>
        <ExternalLink className="mr-2 h-4 w-4" />
        Open in New Tab
      </Button>
      <Button onClick={() => handleFileDownload(file)}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
}
