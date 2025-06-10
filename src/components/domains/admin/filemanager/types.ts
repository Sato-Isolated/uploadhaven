// Import centralized types
import type { AdminFileData } from '@/types';

// Re-export for backward compatibility during migration
export type FileData = AdminFileData;

export interface AdminFileManagerProps {
  files: AdminFileData[];
}

export interface Statistic {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  bgGradient: string;
}
