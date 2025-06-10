import { CheckCircle } from "lucide-react";

export function FilePreviewSecurityNotice() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-green-800 font-medium">
          Secure Download
        </span>
      </div>
      <p className="text-green-700 text-sm mt-1">
        This file has been scanned and is safe to download.
      </p>
    </div>
  );
}
