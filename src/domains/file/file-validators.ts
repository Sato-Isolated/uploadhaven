import { BaseValidator, ValidationResult, ValidationUtils } from '../shared/validation';
import { FileConfiguration } from '../shared/configuration';
import { FileUploadRequest } from './file-value-objects';

/**
 * Validateur pour les requêtes d'upload de fichiers
 */
export class FileUploadValidator extends BaseValidator<FileUploadRequest> {
  constructor(private config: FileConfiguration) {
    super();
  }

  validate(request: FileUploadRequest): ValidationResult {
    const errors = [];

    // Validation du fichier
    if (!request.file) {
      errors.push(this.createError('file', 'File is required', 'FILE_REQUIRED'));
    } else {
      // Validation du nom de fichier
      if (!ValidationUtils.isValidFileName(request.file.name)) {
        errors.push(this.createError('file.name', 'Invalid file name', 'INVALID_FILE_NAME'));
      }

      // Validation de la taille
      if (!ValidationUtils.isValidFileSize(request.file.size, this.config.maxFileSize)) {
        errors.push(this.createError(
          'file.size', 
          `File size must be between 1 byte and ${this.formatFileSize(this.config.maxFileSize)}`, 
          'INVALID_FILE_SIZE'
        ));
      }

      // Validation du type MIME
      if (!ValidationUtils.isValidMimeType(request.file.type, this.config.allowedMimeTypes)) {
        errors.push(this.createError(
          'file.type', 
          `File type ${request.file.type} is not allowed`, 
          'INVALID_MIME_TYPE'
        ));
      }
    }

    // Validation des heures d'expiration
    if (request.expirationHours !== undefined) {
      if (!ValidationUtils.isValidTimeRange(
        request.expirationHours, 
        this.config.minExpirationHours, 
        this.config.maxExpirationHours
      )) {
        errors.push(this.createError(
          'expirationHours',
          `Expiration must be between ${this.config.minExpirationHours} and ${this.config.maxExpirationHours} hours`,
          'INVALID_EXPIRATION_HOURS'
        ));
      }
    }

    // Validation du nombre maximum de téléchargements
    if (request.maxDownloads !== undefined) {
      if (request.maxDownloads < 1 || request.maxDownloads > this.config.maxMaxDownloads) {
        errors.push(this.createError(
          'maxDownloads',
          `Max downloads must be between 1 and ${this.config.maxMaxDownloads}`,
          'INVALID_MAX_DOWNLOADS'
        ));
      }
    }

    // Validation du mot de passe (si requis pour les gros fichiers)
    if (request.file && this.isPasswordRequired(request.file.size) && !request.password) {
      errors.push(this.createError(
        'password',
        'Password is required for large files',
        'PASSWORD_REQUIRED_FOR_LARGE_FILES'
      ));
    }

    return this.createResult(errors);
  }

  private isPasswordRequired(fileSize: number): boolean {
    // Cette logique pourrait être configurée via SecurityConfiguration
    return fileSize > 50 * 1024 * 1024; // 50MB
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
  }
}

/**
 * Validateur pour les noms de fichiers lors de l'upload
 */
export class FileNameValidator extends BaseValidator<string> {
  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.app', '.deb', '.pkg', '.dmg', '.sh', '.ps1'
  ];

  validate(fileName: string): ValidationResult {
    const errors = [];

    if (!fileName || fileName.trim().length === 0) {
      errors.push(this.createError('fileName', 'File name cannot be empty', 'EMPTY_FILE_NAME'));
      return this.createResult(errors);
    }

    const trimmedName = fileName.trim();

    // Vérification de la longueur
    if (trimmedName.length > 255) {
      errors.push(this.createError('fileName', 'File name is too long (max 255 characters)', 'FILE_NAME_TOO_LONG'));
    }

    // Vérification des caractères interdits
    const forbiddenChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (forbiddenChars.test(trimmedName)) {
      errors.push(this.createError('fileName', 'File name contains forbidden characters', 'FORBIDDEN_CHARACTERS'));
    }

    // Vérification des noms réservés Windows
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(trimmedName)) {
      errors.push(this.createError('fileName', 'File name is reserved by the system', 'RESERVED_FILE_NAME'));
    }

    // Vérification des extensions dangereuses
    const extension = this.getFileExtension(trimmedName);
    if (extension && FileNameValidator.DANGEROUS_EXTENSIONS.includes(extension.toLowerCase())) {
      errors.push(this.createError('fileName', 'File extension is not allowed for security reasons', 'DANGEROUS_EXTENSION'));
    }

    // Vérification que le nom ne commence/finit pas par des espaces ou des points
    if (trimmedName.startsWith('.') || trimmedName.endsWith('.') || 
        trimmedName.startsWith(' ') || trimmedName.endsWith(' ')) {
      errors.push(this.createError('fileName', 'File name cannot start or end with spaces or dots', 'INVALID_FILE_NAME_FORMAT'));
    }

    return this.createResult(errors);
  }

  private getFileExtension(fileName: string): string | null {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
      return null;
    }
    return fileName.substring(lastDotIndex);
  }
}

/**
 * Validateur pour les mots de passe de fichiers
 */
export class FilePasswordValidator extends BaseValidator<string | undefined> {
  validate(password: string | undefined): ValidationResult {
    const errors: any[] = [];

    if (password === undefined) {
      return this.createResult(errors); // Pas de mot de passe = valide
    }

    if (password.length < 4) {
      errors.push(this.createError('password', 'Password must be at least 4 characters long', 'PASSWORD_TOO_SHORT'));
    }

    if (password.length > 128) {
      errors.push(this.createError('password', 'Password is too long (max 128 characters)', 'PASSWORD_TOO_LONG'));
    }

    // Vérification de caractères de contrôle
    if (/[\u0000-\u001f]/.test(password)) {
      errors.push(this.createError('password', 'Password contains invalid characters', 'INVALID_PASSWORD_CHARACTERS'));
    }

    return this.createResult(errors);
  }
}
