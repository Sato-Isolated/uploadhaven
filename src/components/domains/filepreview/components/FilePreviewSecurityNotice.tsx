import { CheckCircle } from 'lucide-react';

export function FilePreviewSecurityNotice() {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="font-medium text-green-800">Secure Download</span>
      </div>
      <p className="mt-1 text-sm text-green-700">
        This file has been scanned and is safe to download.
      </p>
    </div>
  );
}
