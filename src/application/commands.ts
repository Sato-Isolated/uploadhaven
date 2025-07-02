/**
 * Commands et Queries pour l'architecture CQRS
 */

import { FileUploadRequest, FileDownloadRequest } from '../domains/file/file-value-objects';

/**
 * Interface de base pour toutes les commandes
 */
export interface Command {
  readonly type: string;
  readonly timestamp: Date;
}

/**
 * Interface de base pour toutes les queries
 */
export interface Query {
  readonly type: string;
}

/**
 * Résultat générique pour les opérations
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============= FILE COMMANDS =============

/**
 * Commande pour uploader un fichier
 */
export interface UploadFileCommand extends Command {
  readonly type: 'UPLOAD_FILE';
  readonly payload: FileUploadRequest & {
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
      userId?: string;
    };
  };
}

/**
 * Commande pour télécharger un fichier
 */
export interface DownloadFileCommand extends Command {
  readonly type: 'DOWNLOAD_FILE';
  readonly payload: FileDownloadRequest & {
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
      userId?: string;
    };
  };
}

/**
 * Commande pour supprimer un fichier
 */
export interface DeleteFileCommand extends Command {
  readonly type: 'DELETE_FILE';
  readonly payload: {
    fileId: string;
    reason: 'manual' | 'expired' | 'cleanup';
    userId?: string;
  };
}

// ============= SHARE COMMANDS =============

/**
 * Commande pour créer un partage
 */
export interface CreateShareCommand extends Command {
  readonly type: 'CREATE_SHARE';
  readonly payload: {
    fileId: string;
    expirationHours?: number;
    maxAccess?: number;
    passwordProtected?: boolean;
    passwordHash?: string;
    metadata?: {
      userId?: string;
      ipAddress?: string;
    };
  };
}

/**
 * Commande pour accéder à un partage
 */
export interface AccessShareCommand extends Command {
  readonly type: 'ACCESS_SHARE';
  readonly payload: {
    shareId: string;
    password?: string;
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
    };
  };
}

// ============= ADMIN COMMANDS =============

/**
 * Commande pour nettoyer les fichiers expirés
 */
export interface CleanupExpiredFilesCommand extends Command {
  readonly type: 'CLEANUP_EXPIRED_FILES';
  readonly payload: {
    dryRun?: boolean;
    maxAge?: number; // heures
  };
}

// ============= QUERIES =============

/**
 * Query pour obtenir les informations d'un fichier
 */
export interface GetFileInfoQuery extends Query {
  readonly type: 'GET_FILE_INFO';
  readonly fileId: string;
}

/**
 * Query pour obtenir les informations d'un partage
 */
export interface GetShareInfoQuery extends Query {
  readonly type: 'GET_SHARE_INFO';
  readonly shareId: string;
}

/**
 * Query pour lister les fichiers (pour l'admin)
 */
export interface ListFilesQuery extends Query {
  readonly type: 'LIST_FILES';
  readonly filters?: {
    status?: 'active' | 'expired';
    uploadedAfter?: Date;
    uploadedBefore?: Date;
    minSize?: number;
    maxSize?: number;
    mimeType?: string;
  };
  readonly pagination?: {
    page: number;
    limit: number;
  };
  readonly sorting?: {
    field: 'uploadedAt' | 'size' | 'downloadCount';
    direction: 'asc' | 'desc';
  };
}

/**
 * Query pour obtenir des statistiques
 */
export interface GetStatsQuery extends Query {
  readonly type: 'GET_STATS';
  readonly period?: {
    start: Date;
    end: Date;
  };
  readonly granularity?: 'hour' | 'day' | 'week' | 'month';
}

// ============= COMMAND/QUERY FACTORIES =============

export class CommandFactory {
  static uploadFile(payload: UploadFileCommand['payload']): UploadFileCommand {
    return {
      type: 'UPLOAD_FILE',
      timestamp: new Date(),
      payload
    };
  }

  static downloadFile(payload: DownloadFileCommand['payload']): DownloadFileCommand {
    return {
      type: 'DOWNLOAD_FILE',
      timestamp: new Date(),
      payload
    };
  }

  static deleteFile(payload: DeleteFileCommand['payload']): DeleteFileCommand {
    return {
      type: 'DELETE_FILE',
      timestamp: new Date(),
      payload
    };
  }

  static createShare(payload: CreateShareCommand['payload']): CreateShareCommand {
    return {
      type: 'CREATE_SHARE',
      timestamp: new Date(),
      payload
    };
  }

  static accessShare(payload: AccessShareCommand['payload']): AccessShareCommand {
    return {
      type: 'ACCESS_SHARE',
      timestamp: new Date(),
      payload
    };
  }

  static cleanupExpiredFiles(payload: CleanupExpiredFilesCommand['payload'] = {}): CleanupExpiredFilesCommand {
    return {
      type: 'CLEANUP_EXPIRED_FILES',
      timestamp: new Date(),
      payload
    };
  }
}

export class QueryFactory {
  static getFileInfo(fileId: string): GetFileInfoQuery {
    return {
      type: 'GET_FILE_INFO',
      fileId
    };
  }

  static getShareInfo(shareId: string): GetShareInfoQuery {
    return {
      type: 'GET_SHARE_INFO',
      shareId
    };
  }

  static listFiles(
    filters?: ListFilesQuery['filters'],
    pagination?: ListFilesQuery['pagination'],
    sorting?: ListFilesQuery['sorting']
  ): ListFilesQuery {
    return {
      type: 'LIST_FILES',
      filters,
      pagination,
      sorting
    };
  }

  static getStats(
    period?: GetStatsQuery['period'],
    granularity?: GetStatsQuery['granularity']
  ): GetStatsQuery {
    return {
      type: 'GET_STATS',
      period,
      granularity
    };
  }
}
