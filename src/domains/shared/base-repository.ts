/**
 * Interface de base pour tous les repositories
 */
export interface BaseRepository<T> {
  save(entity: T): Promise<void>;
  findById(id: string): Promise<T | null>;
  delete(id: string): Promise<void>;
  cleanup(): Promise<number>;
}

/**
 * Interface pour les repositories qui supportent l'incrémentation de compteurs
 */
export interface CountableRepository<T> extends BaseRepository<T> {
  incrementCount(id: string): Promise<void>;
}

/**
 * Types pour les résultats de cleanup
 */
export interface CleanupResult {
  removedCount: number;
  details?: string;
}
