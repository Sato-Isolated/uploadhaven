/**
 * 🧪 Tests pour DownloadFile Use Case
 * 
 * Teste le use case de download de fichiers avec sécurité zero-knowledge
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DownloadFileUseCase, type DownloadFileRequest } from '../application/usecases/download-file.usecase';

// Mock simple du repository
const createMockRepository = () => ({
  store: vi.fn(),
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

// Mock d'un fichier SharedFile pour les tests
const createMockSharedFile = (overrides: any = {}) => {
  const defaults = {
    id: 'abc1234567', // ID de 10 caractères exactement
    encryptedBlob: new Uint8Array([1, 2, 3, 4, 5]), // Données chiffrées simulées
    iv: 'AQIDBAUGBwgJCgsM',
    size: 5,
    uploadedAt: new Date('2025-06-23T10:00:00.000Z'),
    expiresAt: new Date('2025-06-24T10:00:00.000Z'), // Expire demain (non expiré)
    maxDownloads: 10,
    downloadCount: 0,
    isDeleted: false,
    canDownload: () => true,
    incrementDownloadCount: vi.fn(),
  };

  const merged = { ...defaults, ...overrides };
  
  const mockObj = {
    // All basic properties including downloadCount
    ...merged,
    // Dynamic properties as getters
    get isExpired() {
      if (overrides.hasOwnProperty('isExpired')) {
        return typeof overrides.isExpired === 'function' ? overrides.isExpired() : overrides.isExpired;
      }
      return merged.expiresAt < new Date();
    },    get remainingDownloads() {
      return Math.max(0, this.maxDownloads - this.downloadCount);
    },
    get isAvailable() {
      return !this.isExpired && !merged.isDeleted && this.remainingDownloads > 0;
    },
    recordDownload: vi.fn()
  };
  // Set up recordDownload implementation
  mockObj.recordDownload.mockImplementation(() => {
    if (mockObj.isExpired) {
      throw new Error('File has expired');
    }
    if (merged.isDeleted) {
      throw new Error('File has been deleted');
    }
    if (mockObj.remainingDownloads <= 0) {
      throw new Error('Download limit exceeded');
    }
    mockObj.downloadCount++; // Update the actual object property
  });

  return mockObj;
};

describe('DownloadFile Use Case', () => {
  let downloadUseCase: DownloadFileUseCase;
  let mockRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    downloadUseCase = new DownloadFileUseCase(mockRepository as any);
  });

  describe('Cas Nominal', () => {
    
    it('devrait télécharger un fichier existant', async () => {
      // Arrange
      const mockFile = createMockSharedFile();
      mockRepository.findById.mockResolvedValue(mockFile);
      mockRepository.update.mockResolvedValue(undefined);

      const request: DownloadFileRequest = {
        fileId: 'abc1234567'
      };

      // Act
      const result = await downloadUseCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.fileId).toBe('abc1234567');
      expect(result.encryptedBlob).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
      expect(result.iv).toBe('AQIDBAUGBwgJCgsM');
      expect(result.size).toBe(5);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.remainingDownloads).toBe(9); // 10 - 1
      expect(result.downloadCount).toBe(1);

      // Vérifier que le repository a été appelé
      expect(mockRepository.findById).toHaveBeenCalledOnce();
      expect(mockRepository.update).toHaveBeenCalledOnce();
    });    it('devrait gérer les téléchargements illimités', async () => {
      // Arrange
      const mockFile = createMockSharedFile({
        maxDownloads: 1000, // Illimité = 1000 (limite pratique)
        downloadCount: 5
      });
      mockRepository.findById.mockResolvedValue(mockFile);
      mockRepository.update.mockResolvedValue(undefined);

      const request: DownloadFileRequest = {
        fileId: 'abc1234567'
      };

      // Act
      const result = await downloadUseCase.execute(request);

      // Assert
      expect(result.remainingDownloads).toBe(994); // 1000 - 6
      expect(result.downloadCount).toBe(6); // 5 + 1
    });

  });

  describe('Sécurité Zero-Knowledge', () => {
    
    it('ne devrait retourner que les données chiffrées', async () => {
      // Arrange
      const mockFile = createMockSharedFile();
      mockRepository.findById.mockResolvedValue(mockFile);
      mockRepository.update.mockResolvedValue(undefined);

      const request: DownloadFileRequest = {
        fileId: 'abc1234567'
      };

      // Act
      const result = await downloadUseCase.execute(request);

      // Assert - Vérifier qu'aucune donnée sensible n'est exposée
      expect(result).not.toHaveProperty('decryptionKey');
      expect(result).not.toHaveProperty('encryptionKey');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('plaintext');
      
      // Seules les données chiffrées et métadonnées publiques
      expect(result.encryptedBlob).toBeInstanceOf(Uint8Array);
      expect(typeof result.iv).toBe('string');
      expect(typeof result.fileId).toBe('string');
      expect(typeof result.size).toBe('number');
    });

    it('ne devrait pas inclure de clés dans la requête', async () => {
      // Arrange
      const request: DownloadFileRequest = {
        fileId: 'abc1234567'
        // Note: Pas de clé de chiffrement dans la requête !
      };

      // Assert - Vérifier que la requête n'a pas de propriétés sensibles
      expect(request).not.toHaveProperty('encryptionKey');
      expect(request).not.toHaveProperty('decryptionKey');
      expect(request).not.toHaveProperty('password');
      expect(Object.keys(request)).toEqual(['fileId']);
    });

  });

  describe('Validation et Sécurité', () => {
    
    it('devrait rejeter les fichiers inexistants', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      const request: DownloadFileRequest = {
        fileId: 'nex1234567'
      };

      // Act & Assert
      await expect(downloadUseCase.execute(request)).rejects.toThrow();
    });    it('devrait rejeter les fichiers expirés', async () => {
      // Arrange
      const expiredFile = createMockSharedFile({
        id: 'exp1234567',
        expiresAt: new Date('2025-06-22T10:00:00.000Z'), // Hier (expiré automatiquement)
      });
      mockRepository.findById.mockResolvedValue(expiredFile);

      const request: DownloadFileRequest = {
        fileId: 'exp1234567'
      };

      // Act & Assert
      await expect(downloadUseCase.execute(request)).rejects.toThrow();
    });

    it('devrait rejeter les fichiers ayant atteint la limite de téléchargements', async () => {
      // Arrange
      const exhaustedFile = createMockSharedFile({
        maxDownloads: 5,
        downloadCount: 5,
        canDownload: () => false
      });
      mockRepository.findById.mockResolvedValue(exhaustedFile);

      const request: DownloadFileRequest = {
        fileId: 'exh1234567'
      };

      // Act & Assert
      await expect(downloadUseCase.execute(request)).rejects.toThrow();
    });

    it('devrait valider le format du fileId', async () => {
      // Arrange & Act & Assert
      const invalidRequests = [
        { fileId: '' },
        { fileId: '   ' },
        { fileId: 'a' }, // Trop court
        { fileId: 'invalid/file/id' }, // Caractères invalides
      ];

      for (const request of invalidRequests) {
        await expect(downloadUseCase.execute(request)).rejects.toThrow();
      }
    });

  });

  describe('Gestion des Statistiques', () => {
    
    it('devrait incrémenter le compteur de téléchargements', async () => {
      // Arrange
      const mockFile = createMockSharedFile({
        downloadCount: 3
      });
      mockRepository.findById.mockResolvedValue(mockFile);
      mockRepository.update.mockResolvedValue(undefined);

      const request: DownloadFileRequest = {
        fileId: 'abc1234567'
      };

      // Act
      const result = await downloadUseCase.execute(request);      // Assert
      expect(result.downloadCount).toBe(4); // 3 + 1
      expect(mockFile.recordDownload).toHaveBeenCalledOnce();
      expect(mockRepository.update).toHaveBeenCalledWith(mockFile);
    });

    it('devrait calculer correctement les téléchargements restants', async () => {      // Arrange
      const testCases = [
        { maxDownloads: 10, downloadCount: 3, expected: 6 }, // 10 - 4 (après incrémentation)
        { maxDownloads: 5, downloadCount: 2, expected: 2 },   // 5 - 3
        { maxDownloads: 1000, downloadCount: 100, expected: 899 }, // 1000 - 101 (illimité pratique)
      ];

      for (const testCase of testCases) {
        // Arrange
        const mockFile = createMockSharedFile({
          maxDownloads: testCase.maxDownloads,
          downloadCount: testCase.downloadCount
        });
        mockRepository.findById.mockResolvedValue(mockFile);
        mockRepository.update.mockResolvedValue(undefined);

        const request: DownloadFileRequest = {
          fileId: 'abc1234567'
        };

        // Act
        const result = await downloadUseCase.execute(request);

        // Assert
        expect(result.remainingDownloads).toBe(testCase.expected);
      }
    });

  });

  describe('Gestion d\'Erreurs', () => {
    
    it('devrait gérer les erreurs de base de données', async () => {
      // Arrange
      mockRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      const request: DownloadFileRequest = {
        fileId: 'abc1234567'
      };

      // Act & Assert
      await expect(downloadUseCase.execute(request)).rejects.toThrow();
    });

    it('devrait gérer les erreurs de mise à jour des statistiques', async () => {
      // Arrange
      const mockFile = createMockSharedFile();
      mockRepository.findById.mockResolvedValue(mockFile);
      mockRepository.update.mockRejectedValue(new Error('Update failed'));

      const request: DownloadFileRequest = {
        fileId: 'abc1234567'
      };

      // Act & Assert
      await expect(downloadUseCase.execute(request)).rejects.toThrow();
    });

  });

});
