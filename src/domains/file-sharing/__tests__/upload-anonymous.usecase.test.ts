/**
 * 🧪 Tests pour UploadAnonymous Use Case
 * 
 * Teste le use case d'upload anonyme avec les vraies données et interfaces
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UploadAnonymousUseCase, type UploadAnonymousRequest } from '../application/usecases/upload-anonymous.usecase';
import type { IFileRepository } from '../application/interfaces/file.repository.interface';
import { SharedFile } from '../domain/entities/shared-file.entity';
import { FileId } from '../domain/value-objects/file-id.vo';

// Mock du repository
const mockFileRepository: IFileRepository = {
  store: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  getMetadata: vi.fn(),
  findExpiredFiles: vi.fn(),
  findExhaustedFiles: vi.fn(),
  bulkDelete: vi.fn(),
  getActiveFileCount: vi.fn(),
  getTotalStorageUsed: vi.fn(),
  getStorageStats: vi.fn(),
  cleanup: vi.fn(),
  verifyIntegrity: vi.fn(),
  getHealth: vi.fn()
};

describe('Upload Anonymous Use Case', () => {
  let uploadUseCase: UploadAnonymousUseCase;
  const baseUrl = 'https://test.uploadhaven.dev';

  beforeEach(() => {
    vi.clearAllMocks();
    uploadUseCase = new UploadAnonymousUseCase(mockFileRepository, baseUrl);
  });

  describe('✅ Cas Nominal', () => {
    
    it('devrait uploader un fichier chiffré avec succès', async () => {
      // Arrange
      const encryptedData = new ArrayBuffer(100);
      const testRequest: UploadAnonymousRequest = {
        encryptedData,
        metadata: {
          size: 100,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsM',
          salt: 'test-salt',
          iterations: 100000
        },
        ttlHours: 24,
        maxDownloads: 10,
        isPasswordProtected: false
      };      // Mock successful save
      vi.mocked(mockFileRepository.store).mockResolvedValue(undefined);

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.fileId).toMatch(/^[a-zA-Z0-9_-]+$/);
      expect(result.shareUrl).toContain('/s/');
      expect(result.shareUrl).toContain(result.fileId);
      expect(result.size).toBe(100);
      expect(result.maxDownloads).toBe(10);
      expect(result.isPasswordProtected).toBe(false);
      expect(result.expiresAt).toBeInstanceOf(Date);
      
      // Vérifier l'expiration (24h dans le futur)
      const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(1000); // Moins d'une seconde de différence

      // Vérifier que le repository a été appelé      expect(mockFileRepository.store).toHaveBeenCalledOnce();
      const savedFile = vi.mocked(mockFileRepository.store).mock.calls[0][0];
      expect(savedFile).toBeInstanceOf(SharedFile);
    });

    it('devrait gérer les téléchargements illimités', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(50),        metadata: {
          size: 50,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsN',
          salt: 'test-salt',
          iterations: 100000        },
        ttlHours: 48,
        // maxDownloads: undefined = illimité
        isPasswordProtected: true
      };

      vi.mocked(mockFileRepository.store).mockResolvedValue(undefined);

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert
      expect(result.maxDownloads).toBeNull(); // null = illimité
      expect(result.isPasswordProtected).toBe(true);
    });

  });

  describe('🔒 Sécurité Zero-Knowledge', () => {
    
    it('ne devrait jamais exposer les clés de chiffrement', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),
        metadata: {
          size: 100,          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsO',
          salt: 'public-salt',
          iterations: 100000
        }
      };

      vi.mocked(mockFileRepository.store).mockResolvedValue(undefined);

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert - Vérifier qu'aucune donnée sensible n'est exposée
      expect(result).not.toHaveProperty('encryptionKey');
      expect(result).not.toHaveProperty('decryptionKey');
      expect(result).not.toHaveProperty('password');
      
      // L'URL de partage ne doit pas contenir de clé
      expect(result.shareUrl).not.toMatch(/#.+/); // Pas de fragment avec clé
      
      // Vérifier que les métadonnées publiques sont OK
      expect(result.size).toBe(100);
      expect(typeof result.fileId).toBe('string');
    });

    it('devrait accepter seulement des données déjà chiffrées', async () => {
      // Arrange - Simuler des données chiffrées
      const encryptedBuffer = new ArrayBuffer(256);
      const view = new Uint8Array(encryptedBuffer);
      
      // Remplir avec des données "random-like" (simuler du chiffré)
      for (let i = 0; i < view.length; i++) {
        view[i] = Math.floor(Math.random() * 256);
      }

      const testRequest: UploadAnonymousRequest = {
        encryptedData: encryptedBuffer,
        metadata: {
          size: 256,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsP',          salt: 'random-salt',
          iterations: 100000
        }
      };

      vi.mocked(mockFileRepository.store).mockResolvedValue(undefined);

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert
      expect(result.size).toBe(256);
      expect(mockFileRepository.store).toHaveBeenCalled();
      
      // Vérifier que les données stockées sont bien celles qu'on a passées
      const savedFile = vi.mocked(mockFileRepository.store).mock.calls[0][0];
      expect(savedFile.encryptedBlob).toBeInstanceOf(Uint8Array);
      expect(savedFile.encryptedBlob.length).toBe(256);
    });

  });

  describe('Gestion d\'Erreurs', () => {
    
    it('devrait rejeter les fichiers trop volumineux', async () => {
      // Arrange
      const largeBuffer = new ArrayBuffer(200 * 1024 * 1024); // 200MB
      const testRequest: UploadAnonymousRequest = {
        encryptedData: largeBuffer,        metadata: {
          size: 200 * 1024 * 1024,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsQ',
          salt: 'test-salt',
          iterations: 100000
        }
      };

      // Act & Assert
      await expect(uploadUseCase.execute(testRequest)).rejects.toThrow();
    });

    it('devrait rejeter les TTL invalides', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),        metadata: {
          size: 100,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsR',
          salt: 'test-salt',
          iterations: 100000
        },
        ttlHours: -1 // TTL invalide
      };

      // Act & Assert
      await expect(uploadUseCase.execute(testRequest)).rejects.toThrow();
    });

    it('devrait gérer les échecs de sauvegarde', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),
        metadata: {          size: 100,          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsS',
          salt: 'test-salt',
          iterations: 100000
        }
      };      vi.mocked(mockFileRepository.store).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(uploadUseCase.execute(testRequest)).rejects.toThrow('Upload failed. Please try again.');
    });

  });

  describe('🔧 Configurations et Options', () => {
    
    it('devrait utiliser les valeurs par défaut', async () => {
      // Arrange - Request minimal
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),
        metadata: {
          size: 100,          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsT',
          salt: 'test-salt',          iterations: 100000
        }
        // Pas de ttlHours, maxDownloads, isPasswordProtected
      };

      vi.mocked(mockFileRepository.store).mockResolvedValue(undefined);

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert - Valeurs par défaut
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now()); // Dans le futur
      expect(result.maxDownloads).toBeNull(); // Illimité par défaut
      expect(result.isPasswordProtected).toBe(false); // Pas de mot de passe par défaut
    });

    it('devrait respecter toutes les options personnalisées', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),        metadata: {
          size: 100,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsU',
          salt: 'test-salt',
          iterations: 100000        },
        ttlHours: 72, // 3 jours
        maxDownloads: 5,
        isPasswordProtected: true
      };

      vi.mocked(mockFileRepository.store).mockResolvedValue(undefined);

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert
      expect(result.maxDownloads).toBe(5);
      expect(result.isPasswordProtected).toBe(true);
      
      // Vérifier TTL (72h)
      const expectedExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });

  });

});
