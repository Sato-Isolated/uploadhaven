import { Button } from '@/components/ui/button';
import { Download, Share2, AlertCircle } from 'lucide-react';

interface FilePreviewActionsProps {
  isExpired: boolean;
  downloading: boolean;
  onDownload: () => Promise<void>;
  onCopyShareLink: () => void;
}

export function FilePreviewActions({
  isExpired,
  downloading,
  onDownload,
  onCopyShareLink,
}: FilePreviewActionsProps) {
  return (
    <div className="space-y-3">
      {!isExpired ? (
        <Button
          onClick={onDownload}
          disabled={downloading}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
          size="lg"
        >
          <Download className="mr-2 h-5 w-5" />
          {downloading ? 'Starting Download...' : 'Download File'}
        </Button>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-600" />
          <p className="font-medium text-red-800">This file has expired</p>
          <p className="text-sm text-red-600">
            Download is no longer available
          </p>
        </div>
      )}

      <Button
        onClick={onCopyShareLink}
        variant="outline"
        className="w-full"
        size="lg"
      >
        <Share2 className="mr-2 h-5 w-5" />
        Copy Share Link
      </Button>
    </div>
  );
}
