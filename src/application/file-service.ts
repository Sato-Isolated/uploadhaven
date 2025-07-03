/**
 * Modern File Application Service
 * 
 * This module exports the modern FileApplicationService which provides:
 * - Validation via configurable validators
 * - Event generation for observability
 * - Configuration-driven behavior
 * - Better error handling with specific codes
 * - CQRS pattern with commands/queries
 */

export { FileApplicationService } from './file-application-service';
export { CommandFactory, QueryFactory } from './commands';
export type { 
  UploadFileCommand,
  DownloadFileCommand,
  DeleteFileCommand,
  OperationResult
} from './commands';
