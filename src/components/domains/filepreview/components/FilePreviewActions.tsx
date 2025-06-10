import { Button } from "@/components/ui/button";
import { Download, Share2, AlertCircle } from "lucide-react";

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
  onCopyShareLink 
}: FilePreviewActionsProps) {
  return (
    <div className="space-y-3">
      {!isExpired ? (
        <Button
          onClick={onDownload}
          disabled={downloading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Download className="h-5 w-5 mr-2" />
          {downloading ? "Starting Download..." : "Download File"}
        </Button>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
          <p className="text-red-800 font-medium">
            This file has expired
          </p>
          <p className="text-red-600 text-sm">
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
        <Share2 className="h-5 w-5 mr-2" />
        Copy Share Link
      </Button>
    </div>
  );
}
