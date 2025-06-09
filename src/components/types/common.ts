// Interfaces communes réutilisables pour les composants UploadHaven

// =============================================================================
// API & Data Types
// =============================================================================

/**
 * Structure de base pour tous les événements système
 */
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string | Date;
  details?: string;
  severity?: SecuritySeverity;
  ip?: string;
  userAgent?: string;
}

/**
 * Structure standardisée pour les réponses API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Structure de base pour les réponses de données avec statistiques
 */
export interface DataResponse<T> {
  stats?: T;
  [key: string]: any;
}

// =============================================================================
// Stats & Analytics
// =============================================================================

/**
 * Statistiques de base communes à tous les composants
 */
export interface BaseStats {
  totalFiles: number;
  totalSize: number;
  totalSizeBytes?: number;
}

/**
 * Statistiques utilisateur étendues
 */
export interface UserStats extends BaseStats {
  recentUploads: number;
  expiringSoon: number;
  last7dUploads?: number;
  last24hUploads?: number;
  totalDownloads?: number;
}

/**
 * Statistiques de sécurité
 */
export interface SecurityStats {
  totalEvents: number;
  rateLimitHits: number;
  invalidFiles: number;
  blockedIPs: number;
  last24h: number;
  malwareDetected?: number;
  largeSizeBlocked?: number;
}

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props de base pour tous les composants
 */
export interface BaseComponentProps {
  className?: string;
  loading?: boolean;
  error?: string | null;
}

/**
 * Props pour les composants avec données
 */
export interface DataComponentProps<T> extends BaseComponentProps {
  data?: T;
  onRefresh?: () => void;
}

/**
 * Props pour les composants avec actions
 */
export interface ActionComponentProps extends BaseComponentProps {
  onAction?: () => void;
  actionLoading?: boolean;
  disabled?: boolean;
}

// =============================================================================
// Pagination
// =============================================================================

/**
 * Structure de pagination standardisée
 */
export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Props pour les composants avec pagination
 */
export interface PaginatedComponentProps<T> extends BaseComponentProps {
  data?: T[];
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;
}

// =============================================================================
// User & Auth
// =============================================================================

/**
 * Utilisateur de base
 */
export interface BaseUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

/**
 * Utilisateur étendu avec informations supplémentaires
 */
export interface ExtendedUser extends BaseUser {
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  lastActiveAt?: string;
}

// =============================================================================
// Security
// =============================================================================

/**
 * Niveaux de sévérité pour les événements de sécurité
 */
export type SecuritySeverity = "low" | "medium" | "high" | "critical";

/**
 * Types d'événements de sécurité
 */
export type SecurityEventType =
  | "rate_limit"
  | "invalid_file"
  | "blocked_ip"
  | "malware_detected"
  | "large_file"
  | "access_denied"
  | "suspicious_activity"
  | "system_maintenance"
  | "user_login"
  | "user_logout"
  | "user_registration"
  | "file_scan"
  | "file_upload"
  | "file_download";

/**
 * Événement de sécurité avec détails étendus
 */
export interface SecurityEvent extends Omit<BaseEvent, "details"> {
  type: SecurityEventType;
  severity: SecuritySeverity;
  details: {
    ip?: string;
    filename?: string;
    fileSize?: number;
    userAgent?: string;
    endpoint?: string;
    reason?: string;
    userId?: string;
  };
  message?: string; // Optional message field for compatibility
}

// =============================================================================
// File Types
// =============================================================================

/**
 * Fichier de base
 */
export interface BaseFile {
  id: string;
  filename: string;
  fileSize: number;
  fileType?: string;
  uploadedAt: string;
}

/**
 * Fichier étendu avec informations supplémentaires
 */
export interface ExtendedFile extends BaseFile {
  shortUrl?: string;
  downloadCount?: number;
  expiresAt?: string;
  userId?: string;
  isPasswordProtected?: boolean;
  visibility?: string;
}

/**
 * Métadonnées de fichier depuis l'API
 */
export interface FileMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  expiresAt?: string;
  downloadCount: number;
  isPasswordProtected: boolean;
}

// =============================================================================
// Activity & Events
// =============================================================================

/**
 * Événement d'activité système
 */
export interface ActivityEvent extends BaseEvent {
  _id?: string; // MongoDB-style ID
  type: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
}

/**
 * Réponse d'activités avec pagination
 */
export interface ActivityResponse {
  activities: ActivityEvent[];
  pagination: PaginationData;
}

// =============================================================================
// Form & Input Types
// =============================================================================

/**
 * Options pour les opérations de fichiers
 */
export interface FileOperationOptions {
  loading?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Filtres de base pour les listes
 */
export interface BaseFilters {
  search?: string;
  type?: string;
  severity?: SecuritySeverity;
  dateFrom?: string;
  dateTo?: string;
}

// =============================================================================
// File Upload & Management
// =============================================================================

/**
 * Status du fichier uploadé
 */
export type FileUploadStatus =
  | "scanning"
  | "uploading"
  | "completed"
  | "error"
  | "threat_detected";

/**
 * Fichier uploadé avec métadonnées
 */
export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: FileUploadStatus;
  url?: string;
  shortUrl?: string;
  error?: string;
  scanResult?: { safe: boolean; threat?: string };
  generatedKey?: string;
}

/**
 * Configuration du file uploader
 */
export interface FileUploaderSettings {
  expiration: string;
  isPasswordProtected: boolean;
}

/**
 * Props pour les composants de gestion de fichiers
 */
export interface FileHandlerProps extends BaseComponentProps {
  file: UploadedFile;
  onRemoveFile?: (id: string) => void;
  onCopyToClipboard?: (url: string, label?: string) => void;
}

/**
 * Props pour les composants de statut de fichier
 */
export interface FileStatusProps extends BaseComponentProps {
  status: FileUploadStatus;
  threatDetails?: string;
}

/**
 * Props pour les composants de progrès de fichier
 */
export interface FileProgressProps extends BaseComponentProps {
  files: UploadedFile[];
  onRemoveFile: (id: string) => void;
  onCopyToClipboard: (url: string, label?: string) => void;
}

/**
 * Props pour les paramètres d'upload
 */
export interface UploadSettingsProps extends BaseComponentProps {
  expiration: string;
  isPasswordProtected: boolean;
  onExpirationChange: (value: string) => void;
  onPasswordProtectionChange: (value: boolean) => void;
}

/**
 * Props pour les zones de drop
 */
export interface DropzoneProps extends BaseComponentProps {
  isDragActive: boolean;
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
}

// =============================================================================
// File Preview & Display
// =============================================================================

/**
 * Données de fichier pour l'aperçu
 */
export interface FileData {
  filename: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
}

/**
 * Information sur le type de fichier
 */
export interface FileTypeInfo {
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isText: boolean;
  isPdf: boolean;
  isCode: boolean;
}

/**
 * Props pour les composants d'aperçu de fichier
 */
export interface FilePreviewProps extends BaseComponentProps {
  file: FileData;
}

/**
 * Props pour les actions de fichier
 */
export interface FileActionProps extends BaseComponentProps {
  file: FileData;
  onDownload?: (file: FileData) => void;
  onOpenInNewTab?: (file: FileData) => void;
}

/**
 * Props pour les informations de fichier
 */
export interface FileInfoProps extends BaseComponentProps {
  file: FileData;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Fonction de callback générique
 */
export type CallbackFunction<T = void> = (data?: T) => void;

/**
 * Fonction de callback async générique
 */
export type AsyncCallbackFunction<T = void> = (data?: T) => Promise<void>;

/**
 * État de chargement générique
 */
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

/**
 * État modal générique
 */
export interface ModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

/**
 * Représente un fichier en cours de traitement avec ses métadonnées
 */
export type ProcessingFile = UploadedFile & {
  id: string;
  progress: number;
  status: FileUploadStatus;
  error?: string;
  url?: string;
  expiresAt?: string;
};

// =============================================================================
// Library & System Types
// =============================================================================

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

/**
 * Rate limit tracking data
 */
export interface RateLimitData {
  requests: number;
  windowStart: number;
}

/**
 * Background cleanup operation statistics
 */
export interface CleanupStats {
  deletedCount: number;
  totalExpired: number;
  errors: string[];
}

/**
 * Malware scanning results from various sources
 */
export interface ScanResult {
  isClean: boolean;
  isSuspicious: boolean;
  isMalicious: boolean;
  threatName?: string;
  engineResults?: Array<{
    engine: string;
    result: string;
    category: string;
  }>;
  source: "local" | "virustotal" | "cache";
  scannedAt: Date;
}

/**
 * VirusTotal API response structure
 */
export interface VirusTotalResponse {
  data: {
    attributes: {
      stats: {
        harmless: number;
        malicious: number;
        suspicious: number;
        undetected: number;
      };
      last_analysis_results: Record<
        string,
        {
          category: string;
          engine_name: string;
          result: string | null;
        }
      >;
    };
  };
}

/**
 * Daily quota tracking for external services
 */
export interface DailyQuota {
  date: string;
  used: number;
  limit: number;
}

// =============================================================================
// Database Models
// =============================================================================

/**
 * User model interface for database operations
 */
export interface IUser {
  _id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: "user" | "admin";
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * File model interface for database operations
 */
export interface IFile {
  _id: string;
  filename: string;
  shortUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  expiresAt: Date;
  downloadCount: number;
  ipAddress: string;
  userAgent?: string;
  scanResult: {
    safe: boolean;
    threat?: string;
    scanDate?: Date;
  };
  isDeleted: boolean;
  userId?: string;
  isAnonymous: boolean;
  password?: string; // hashed password for protected files
  isPasswordProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Security event model interface for database operations
 */
export interface ISecurityEvent {
  _id: string;
  type: string;
  timestamp: Date;
  ip: string;
  details: string;
  severity: "low" | "medium" | "high";
  userAgent?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Hook Interfaces
// =============================================================================

/**
 * Configuration options for polling hooks
 */
export interface PollingOptions {
  interval?: number; // in milliseconds
  immediate?: boolean;
  enabled?: boolean;
}

/**
 * Pagination state management
 */
export interface PaginationState {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Configuration options for pagination hooks
 */
export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

/**
 * Modal state management for hooks
 */
export interface HookModalState {
  isOpen: boolean;
  data?: any;
}

/**
 * Return type for modal hooks
 */
export interface UseModalReturn {
  isOpen: boolean;
  data: any;
  openModal: (data?: any) => void;
  closeModal: () => void;
  toggleModal: (data?: any) => void;
}

/**
 * File upload operation options
 */
export interface FileUploadOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

/**
 * File delete operation options
 */
export interface FileDeleteOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Async operation state tracking
 */
export interface AsyncOperationState {
  loading: boolean;
  error: string | null;
}

/**
 * Configuration options for async operation hooks
 */
export interface AsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * API state management for hooks
 */
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Configuration options for API hooks
 */
export interface ApiOptions {
  immediate?: boolean;
  method?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}
