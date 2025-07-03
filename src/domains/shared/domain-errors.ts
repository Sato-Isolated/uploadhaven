/**
 * Base class pour toutes les erreurs du domaine
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  
  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Erreur générique pour les entités non trouvées
 */
export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND';
  
  constructor(entityType: string, entityId: string) {
    super(`${entityType} with id ${entityId} not found`, { entityType, entityId });
  }
}

/**
 * Erreur générique pour les entités expirées
 */
export class EntityExpiredError extends DomainError {
  readonly code = 'ENTITY_EXPIRED';
  
  constructor(entityType: string, entityId: string) {
    super(`${entityType} with id ${entityId} has expired`, { entityType, entityId });
  }
}

/**
 * Erreur générique pour les limites atteintes
 */
export class MaxLimitReachedError extends DomainError {
  readonly code = 'MAX_LIMIT_REACHED';
  
  constructor(entityType: string, entityId: string, limitType: string) {
    super(`${entityType} with id ${entityId} has reached maximum ${limitType}`, { 
      entityType, 
      entityId, 
      limitType 
    });
  }
}

/**
 * Erreurs spécifiques pour les fichiers
 */
export class FileNotFoundError extends EntityNotFoundError {
  constructor(fileId: string) {
    super('File', fileId);
  }
}

export class FileExpiredError extends EntityExpiredError {
  constructor(fileId: string) {
    super('File', fileId);
  }
}

export class MaxDownloadsReachedError extends MaxLimitReachedError {
  constructor(fileId: string) {
    super('File', fileId, 'downloads');
  }
}

/**
 * Erreurs spécifiques pour les partages
 */
export class ShareNotFoundError extends EntityNotFoundError {
  constructor(shareId: string) {
    super('Share', shareId);
  }
}

export class ShareExpiredError extends EntityExpiredError {
  constructor(shareId: string) {
    super('Share', shareId);
  }
}

export class MaxAccessReachedError extends MaxLimitReachedError {
  constructor(shareId: string) {
    super('Share', shareId, 'access count');
  }
}

/**
 * Erreurs spécifiques au stockage
 */
export class StorageFileNotFoundError extends EntityNotFoundError {
  constructor(path: string) {
    super('Storage file', path);
  }
}

export class StorageError extends DomainError {
  readonly code = 'STORAGE_ERROR';
  
  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

/**
 * Erreurs spécifiques au chiffrement
 */
export class InvalidPasswordError extends DomainError {
  readonly code = 'INVALID_PASSWORD';
  
  constructor() {
    super('Invalid password provided');
  }
}

export class EncryptionError extends DomainError {
  readonly code = 'ENCRYPTION_ERROR';
  
  constructor(message: string, context?: Record<string, any>) {
    super(`Encryption failed: ${message}`, context);
  }
}

export class DecryptionError extends DomainError {
  readonly code = 'DECRYPTION_ERROR';
  
  constructor(message: string, context?: Record<string, any>) {
    super(`Decryption failed: ${message}`, context);
  }
}
