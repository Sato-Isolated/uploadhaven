// Base entities and utilities
export * from './base-entity';
export * from './base-repository';
export * from './errors';
export * from './validation';
export * from './configuration';
export * from './events';

// Domain-specific errors (avoiding conflicts with general errors)
export {
  DomainError,
  EntityNotFoundError,
  EntityExpiredError,
  MaxLimitReachedError,
  FileNotFoundError,
  FileExpiredError,
  MaxDownloadsReachedError,
  ShareNotFoundError,
  ShareExpiredError,
  MaxAccessReachedError,
  StorageFileNotFoundError,
  InvalidPasswordError,
  EncryptionError,
  DecryptionError
} from './domain-errors';
