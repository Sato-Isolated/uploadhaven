import { randomUUID } from 'crypto';

/**
 * Interface de base pour toutes les entités métier
 */
export interface BaseEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}

/**
 * Interface pour les entités qui peuvent expirer
 */
export interface Expirable {
  isExpired(): boolean;
  canBeAccessed(): boolean;
}

/**
 * Interface pour les entités qui ont un compteur avec limite
 */
export interface Countable<T = any> {
  readonly count: number;
  readonly maxCount?: number;
  hasReachedMaxCount(): boolean;
  incrementCount(): T;
}

/**
 * Paramètres de base pour la création d'entités
 */
export interface BaseCreateParams {
  expirationHours?: number;
}

/**
 * Utilitaires partagés pour les entités
 */
export class EntityUtils {
  /**
   * Génère un nouvel ID unique
   */
  static generateId(): string {
    return randomUUID();
  }

  /**
   * Calcule la date d'expiration
   */
  static calculateExpirationDate(hours: number = 24): Date {
    const now = new Date();
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  /**
   * Vérifie si une date est expirée
   */
  static isExpired(expirationDate: Date): boolean {
    return new Date() > expirationDate;
  }
}
