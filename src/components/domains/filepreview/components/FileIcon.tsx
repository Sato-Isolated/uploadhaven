import { FileText, Code, Image as ImageIcon, Video, Music } from "lucide-react";
import type {
  FileTypeInfo,
  BaseComponentProps,
} from "@/types";

interface FileIconProps extends BaseComponentProps {
  typeInfo: FileTypeInfo;
}

export function FileIcon({ typeInfo, className = "w-6 h-6" }: FileIconProps) {
  if (typeInfo.isImage) {
    return <ImageIcon className={`${className} text-blue-500`} />;
  }
  if (typeInfo.isVideo) {
    return <Video className={`${className} text-purple-500`} />;
  }
  if (typeInfo.isAudio) {
    return <Music className={`${className} text-green-500`} />;
  }
  if (typeInfo.isText || typeInfo.isCode) {
    return <Code className={`${className} text-orange-500`} />;
  }
  return <FileText className={`${className} text-gray-500`} />;
}
