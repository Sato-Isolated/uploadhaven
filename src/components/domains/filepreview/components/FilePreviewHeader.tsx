import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { getFileIcon, getFileTypeLabel } from "../utils/fileUtils";
import type { ClientFileData } from "@/types";

interface FilePreviewHeaderProps {
  fileInfo: ClientFileData;
  isExpired: boolean;
}

export function FilePreviewHeader({ fileInfo, isExpired }: FilePreviewHeaderProps) {
  const IconComponent = getFileIcon(fileInfo.mimeType);
  
  return (
    <CardHeader>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 text-blue-600">
          <IconComponent className="h-8 w-8" />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-xl font-semibold truncate">
            {fileInfo.originalName}
          </CardTitle>          <CardDescription className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary">
              {getFileTypeLabel(fileInfo.mimeType)}
            </Badge>
            {isExpired && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            )}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}
