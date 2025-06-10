import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function FilePreviewNoFileState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">File information not available</p>
        </CardContent>
      </Card>
    </div>
  );
}
