export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'name' | 'size';
  sortOrder?: 'asc' | 'desc';
}

export interface FileSearchFilters {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  minSize?: number; // en bytes
  maxSize?: number; // en bytes
  status?: 'active' | 'expired' | 'expiring_soon';
  mimeType?: string;
}

export interface UserFileStats {
  totalFiles: number;
  totalSize: number; // en bytes
  activeFiles: number;
  expiredFiles: number;
  expiringFiles: number; // expire dans les 24h
  totalDownloads: number;
  mostDownloadedFile?: {
    id: string;
    name: string;
    downloads: number;
  };
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
