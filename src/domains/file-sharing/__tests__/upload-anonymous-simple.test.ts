/**
 * 🧪 Tests pour UploadAnonymous Use Case (Version simplifiée)
 * 
 * Teste les fonctionnalités principales du use case d'upload anonyme
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UploadAnonymousUseCase, type UploadAnonymousRequest } from '../application/usecases/upload-anonymous.usecase';

// Mock simple pour les tests de base
const createMockRepository = () => ({
  store: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  exists: vi.fn(),
  getMetadata: vi.fn(),
  findExpiredFiles: vi.fn(),
  findExhaustedFiles: vi.fn(),
  cleanup: vi.fn(),
  getStorageStats: vi.fn()
});

describe('UploadAnonymous Use Case', () => {
  let uploadUseCase: UploadAnonymousUseCase;
  let mockRepository: ReturnType<typeof createMockRepository>;
  const baseUrl = 'https://test.uploadhaven.dev';

  beforeEach(() => {
    mockRepository = createMockRepository();
    uploadUseCase = new UploadAnonymousUseCase(mockRepository as any, baseUrl);
  });

  describe('Cas Nominal', () => {
    
    it('devrait accepter une requête valide', async () => {
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
      };

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert - Vérifier la structure de la réponse
      expect(result).toBeDefined();
      expect(typeof result.fileId).toBe('string');
      expect(result.fileId.length).toBeGreaterThan(0);
      expect(result.shareUrl).toContain(baseUrl);
      expect(result.shareUrl).toContain('/s/');
      expect(result.shareUrl).toContain(result.fileId);
      expect(result.size).toBe(100);
      expect(result.maxDownloads).toBe(10);
      expect(result.isPasswordProtected).toBe(false);
      expect(result.expiresAt).toBeInstanceOf(Date);
      
      // Vérifier que le repository a été appelé
      expect(mockRepository.store).toHaveBeenCalledOnce();
    });

    it('devrait gérer les téléchargements illimités', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(50),        metadata: {
          size: 50,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsN',
          salt: 'test-salt',
          iterations: 100000
        },
        ttlHours: 48
        // maxDownloads non défini = illimité
      };

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert
      expect(result.maxDownloads).toBeNull(); // null = illimité
    });

  });

  describe('Validation des Données', () => {
      it('devrait valider la taille minimale', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(0), // Taille 0
        metadata: {
          size: 0,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsO',
          salt: 'test-salt',
          iterations: 100000
        }
      };

      // Act & Assert
      await expect(uploadUseCase.execute(testRequest)).rejects.toThrow();
    });

    it('devrait valider les métadonnées requises', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),        metadata: {
          size: 100,
          algorithm: '', // Algorithme vide
          iv: 'AQIDBAUGBwgJCgsP',
          salt: 'test-salt',
          iterations: 100000
        }
      };

      // Act & Assert
      await expect(uploadUseCase.execute(testRequest)).rejects.toThrow();
    });

  });

  describe('Sécurité Zero-Knowledge', () => {
    
    it('ne devrait jamais exposer les clés de chiffrement dans la réponse', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),
        metadata: {
          size: 100,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsV',
          salt: 'public-salt',
          iterations: 100000
        }
      };

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert - Vérifier qu'aucune donnée sensible n'est exposée
      expect(result).not.toHaveProperty('encryptionKey');
      expect(result).not.toHaveProperty('decryptionKey');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('plaintext');
      
      // L'URL de partage ne doit pas contenir de clé (c'est ajouté côté client)
      expect(result.shareUrl).not.toMatch(/#.+/);
    });    it('devrait générer des URLs de base correctes', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),
        metadata: {
          size: 100,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsR',
          salt: 'test-salt',
          iterations: 100000
        }
      };

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert
      expect(result.shareUrl).toMatch(/^https:\/\/test\.uploadhaven\.dev\/s\/[a-zA-Z0-9_-]+$/);
      expect(result.shareUrl).not.toContain('#'); // Pas de fragment
      expect(result.shareUrl).toContain(result.fileId);
    });

  });

  describe('Configuration et Options', () => {
      it('devrait utiliser les valeurs par défaut', async () => {
      // Arrange - Request minimal
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),        metadata: {
          size: 100,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsS',
          salt: 'test-salt',
          iterations: 100000
        },
        // Pas de ttlHours, maxDownloads, isPasswordProtected
      };

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert - Valeurs par défaut
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(result.maxDownloads).toBeNull(); // Illimité par défaut
      expect(result.isPasswordProtected).toBe(false);
    });

    it('devrait respecter les options personnalisées', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),        metadata: {
          size: 100,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsT',
          salt: 'test-salt',
          iterations: 100000
        },
        ttlHours: 72,
        maxDownloads: 5,
        isPasswordProtected: true
      };

      // Act
      const result = await uploadUseCase.execute(testRequest);

      // Assert
      expect(result.maxDownloads).toBe(5);
      expect(result.isPasswordProtected).toBe(true);
      
      // Vérifier TTL (72h)
      const expectedExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const timeDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime());
      expect(timeDiff).toBeLessThan(2000); // Moins de 2 secondes de différence
    });

  });

  describe('Gestion d\'Erreurs', () => {
      it('devrait gérer les échecs de stockage', async () => {
      // Arrange
      const testRequest: UploadAnonymousRequest = {
        encryptedData: new ArrayBuffer(100),
        metadata: {
          size: 100,
          algorithm: 'AES-256-GCM',
          iv: 'AQIDBAUGBwgJCgsU',
          salt: 'test-salt',
          iterations: 100000
        }
      };

      mockRepository.store.mockRejectedValue(new Error('Storage failed'));

      // Act & Assert
      await expect(uploadUseCase.execute(testRequest)).rejects.toThrow('Upload failed');
    });

  });

});
