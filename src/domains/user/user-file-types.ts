export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface FileSearchFilters {
  name?: string;
  status?: 'active' | 'expired' | 'expiring_soon';
  mimeType?: string;
  startDate?: Date;
  endDate?: Date;
  minSize?: number;
  maxSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UserFileStats {
  totalFiles: number;
  activeFiles: number;
  expiredFiles: number;
  expiringFiles: number;
  totalDownloads: number;
  totalSize: number;
  mostDownloadedFile?: {
    id: string;
    name: string;
    downloads: number;
  };
}

// Type pour les fichiers sérialisés (utilisé dans les composants)
export interface SerializedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  encryptedPath: string;
  uploadedAt: string; // ISO string
  expiresAt: string; // ISO string
  downloadCount: number;
  maxDownloads?: number;
  passwordHash?: string;
  userId?: string;
}

// Type pour les statistiques étendues avec formatage
export interface FormattedUserFileStats extends UserFileStats {
  totalSizeFormatted: string;
  averageFileSizeFormatted: string;
  averageDownloadsPerFile: number;
}
