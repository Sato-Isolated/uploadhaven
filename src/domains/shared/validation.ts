/**
 * Types pour la validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Classe de base pour tous les validateurs
 */
export abstract class BaseValidator<T> {
  abstract validate(data: T): ValidationResult;

  protected createError(field: string, message: string, code: string): ValidationError {
    return { field, message, code };
  }

  protected createResult(errors: ValidationError[] = []): ValidationResult {
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Validateur composite pour combiner plusieurs validateurs
 */
export class CompositeValidator<T> extends BaseValidator<T> {
  constructor(private validators: BaseValidator<T>[]) {
    super();
  }

  validate(data: T): ValidationResult {
    const allErrors: ValidationError[] = [];
    
    for (const validator of this.validators) {
      const result = validator.validate(data);
      allErrors.push(...result.errors);
    }

    return this.createResult(allErrors);
  }
}

/**
 * Utilitaires de validation communs
 */
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType) || 
           allowedTypes.some(type => type.endsWith('/*') && mimeType.startsWith(type.slice(0, -1)));
  }

  static isValidFileSize(size: number, maxSize: number): boolean {
    return size > 0 && size <= maxSize;
  }

  static isValidFileName(name: string): boolean {
    // Vérifie que le nom ne contient pas de caractères dangereux
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    return name.length > 0 && name.length <= 255 && !dangerousChars.test(name);
  }

  static isValidTimeRange(hours: number, minHours: number = 1, maxHours: number = 168): boolean {
    return hours >= minHours && hours <= maxHours;
  }
}
