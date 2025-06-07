export interface FileData {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  expiresAt: string | null;
  downloadCount: number;
  type: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';
  userId?: string;
  userName?: string;
  isAnonymous: boolean;
}

export interface AdminFileManagerProps {
  files: FileData[];
}

export interface Statistic {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgGradient: string;
}
