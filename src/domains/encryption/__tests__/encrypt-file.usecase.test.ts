/**
 * 🧪 Tests pour EncryptFile Use Case (Domaine Encryption)
 * 
 * Teste le use case de chiffrement côté client avec sécurité zero-knowledge
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EncryptFileUseCase, EncryptionValidationError } from '../application/usecases/encrypt-file.usecase';
import { EncryptionKey } from '../domain/value-objects/EncryptionKey';
import { InitializationVector } from '../domain/value-objects/InitializationVector';
import { IEncryptionService } from '../domain/services/IEncryptionService';

// Mock du service d'encryption
const mockEncryptionService: IEncryptionService = {
  generateKey: vi.fn(() => {
    const mockKeyBytes = new Uint8Array(32).fill(123); // Mock key
    return EncryptionKey.fromBytes(mockKeyBytes);
  }),

  deriveKeyFromPassword: vi.fn(async (password: string, salt?: Uint8Array) => {
    const mockKeyBytes = new Uint8Array(32).fill(124); // Mock password-derived key
    const mockSalt = salt || new Uint8Array(32).fill(125);
    return {
      key: EncryptionKey.fromBytes(mockKeyBytes),
      salt: mockSalt
    };
  }),

  encryptFile: vi.fn(async (file: File, key: EncryptionKey) => {
    const mockEncryptedData = new Uint8Array([1, 2, 3, 4, 5]);
    const mockIv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    
    return {
      encryptedData: mockEncryptedData,
      iv: InitializationVector.fromBytes(mockIv),
      originalMetadata: {
        filename: file.name,
        mimeType: file.type,
        size: file.size
      }
    };
  }),

  decryptFile: vi.fn(),
  encryptData: vi.fn(),
  decryptData: vi.fn(),
  checkBrowserSupport: vi.fn(() => ({ supported: true, missingFeatures: [] })),
  generateSalt: vi.fn(() => new Uint8Array(32).fill(126))
};

describe('EncryptFile Use Case - Tests Métier', () => {
  let useCase: EncryptFileUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new EncryptFileUseCase(mockEncryptionService);
  });

  describe('🔐 Chiffrement anonyme (sans mot de passe)', () => {
    it('devrait chiffrer un fichier valide et générer une URL de partage', async () => {
      // Arrange
      const testFile = new File(['Test content'], 'test.txt', { type: 'text/plain' });
      const request = {
        file: testFile,
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.encryptedFile).toBeDefined();
      expect(result.shareUrl).toBeDefined();
      
      // Vérifier que la clé de chiffrement a été générée
      expect(mockEncryptionService.generateKey).toHaveBeenCalledOnce();
      
      // Vérifier que le fichier a été chiffré
      expect(mockEncryptionService.encryptFile).toHaveBeenCalledWith(
        testFile,
        expect.any(EncryptionKey)
      );
        // Vérifier la structure de l'URL de partage (clé dans le fragment)
      expect(result.shareUrl).toMatch(/https:\/\/uploadhaven\.dev\/s\/[a-zA-Z0-9_-]+#[a-zA-Z0-9+/=]+/);
      const [baseUrl, fragment] = result.shareUrl.split('#');
      expect(baseUrl).toContain('/s/');
      expect(fragment).toBeDefined();
      expect(fragment.length).toBeGreaterThan(0);
    });

    it('devrait préserver les métadonnées du fichier original', async () => {
      // Arrange
      const testFile = new File(['Document content'], 'document.pdf', { type: 'application/pdf' });
      const request = {
        file: testFile,
        baseUrl: 'https://test.uploadhaven.dev'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      const clientMetadata = result.encryptedFile.clientMetadata;
      expect(clientMetadata.originalSize).toBe(testFile.size);
      expect(clientMetadata.mimeType).toBe('application/pdf');
      expect(clientMetadata.filename).toBe('document.pdf');
      expect(clientMetadata.algorithm).toBe('AES-256-GCM');
      expect(clientMetadata.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('🔑 Chiffrement avec mot de passe', () => {
    it('devrait dériver une clé à partir du mot de passe', async () => {
      // Arrange
      const testFile = new File(['Secret content'], 'secret.txt', { type: 'text/plain' });
      const request = {
        file: testFile,
        password: 'mon-mot-de-passe-secret',
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toBeDefined();
      
      // Vérifier que la clé a été dérivée du mot de passe
      expect(mockEncryptionService.deriveKeyFromPassword).toHaveBeenCalledWith(
        'mon-mot-de-passe-secret',
        expect.any(Uint8Array) // salt
      );
      
      // Vérifier que generateKey N'a PAS été appelé
      expect(mockEncryptionService.generateKey).not.toHaveBeenCalled();
      
      // Le fichier doit quand même être chiffré
      expect(mockEncryptionService.encryptFile).toHaveBeenCalledWith(
        testFile,
        expect.any(EncryptionKey)
      );
    });
  });

  describe('🚨 Validation et gestion d\'erreurs', () => {
    it('devrait rejeter un fichier null/undefined', async () => {
      // Arrange
      const request = {
        file: null as any,
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(EncryptionValidationError);
      await expect(useCase.execute(request)).rejects.toThrow('File is required');
    });

    it('devrait rejeter un fichier vide', async () => {
      // Arrange
      const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
      const request = {
        file: emptyFile,
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(EncryptionValidationError);
      await expect(useCase.execute(request)).rejects.toThrow('File cannot be empty');
    });

    it('devrait rejeter un fichier trop volumineux (>100MB)', async () => {
      // Arrange
      const largeContent = 'x'.repeat(101 * 1024 * 1024); // 101MB
      const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const request = {
        file: largeFile,
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(EncryptionValidationError);
      await expect(useCase.execute(request)).rejects.toThrow('File too large (maximum 100MB)');
    });

    it('devrait accumuler plusieurs erreurs de validation', async () => {
      // Arrange
      const request = {
        file: null as any,
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act & Assert
      try {
        await useCase.execute(request);
        expect.fail('Should have thrown EncryptionValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(EncryptionValidationError);
        const validationError = error as EncryptionValidationError;
        expect(validationError.errors).toContain('File is required');
      }
    });
  });

  describe('🔒 Garanties de sécurité zero-knowledge', () => {
    it('devrait générer des URLs avec clé dans le fragment (jamais envoyée au serveur)', async () => {
      // Arrange
      const testFile = new File(['Confidential data'], 'confidential.txt', { type: 'text/plain' });
      const request = {
        file: testFile,
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      const url = new URL(result.shareUrl);
      
      // Vérifier que l'URL a un fragment (partie après #)
      expect(url.hash).toBeDefined();
      expect(url.hash.length).toBeGreaterThan(1); // Plus que juste "#"
      
      // Le fragment contient la clé (base64url)
      const keyFragment = url.hash.substring(1); // Enlever le "#"
      expect(keyFragment).toMatch(/^[A-Za-z0-9_-]+$/); // Base64URL format
      
      // La partie avant # ne contient pas de clé
      const baseUrlWithoutFragment = `${url.protocol}//${url.host}${url.pathname}`;
      expect(baseUrlWithoutFragment).not.toContain(keyFragment);
    });

    it('ne devrait jamais stocker la clé de chiffrement avec le fichier chiffré', async () => {
      // Arrange
      const testFile = new File(['Private content'], 'private.txt', { type: 'text/plain' });
      const request = {
        file: testFile,
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      const encryptedFile = result.encryptedFile;
      
      // Vérifier que l'entité EncryptedFile ne contient aucune clé
      expect(encryptedFile.encryptedBlob).toBeDefined();
      expect(encryptedFile.iv).toBeDefined();
      expect(encryptedFile.clientMetadata).toBeDefined();
      
      // Pas de propriété 'key' ou équivalent dans l'entité
      expect((encryptedFile as any).key).toBeUndefined();
      expect((encryptedFile as any).encryptionKey).toBeUndefined();
      expect((encryptedFile as any).decryptionKey).toBeUndefined();
    });

    it('devrait séparer les métadonnées serveur (publiques) des métadonnées client (complètes)', async () => {
      // Arrange
      const testFile = new File(['Sensitive data'], 'sensitive.doc', { type: 'application/msword' });
      const request = {
        file: testFile,
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act
      const result = await useCase.execute(request);
      const encryptedFile = result.encryptedFile;

      // Assert - Métadonnées serveur (limitées pour la vie privée)
      const serverMetadata = encryptedFile.serverMetadata;
      expect(serverMetadata.id).toBeDefined();
      expect(serverMetadata.encryptedSize).toBeDefined();
      expect(serverMetadata.algorithm).toBe('AES-256-GCM');
      expect(serverMetadata.timestamp).toBeInstanceOf(Date);
      
      // Vérifier que les données sensibles ne sont PAS dans les métadonnées serveur
      expect((serverMetadata as any).originalSize).toBeUndefined();
      expect((serverMetadata as any).mimeType).toBeUndefined();
      expect((serverMetadata as any).filename).toBeUndefined();

      // Assert - Métadonnées client (complètes)
      const clientMetadata = encryptedFile.clientMetadata;
      expect(clientMetadata.originalSize).toBe(testFile.size);
      expect(clientMetadata.mimeType).toBe('application/msword');
      expect(clientMetadata.filename).toBe('sensitive.doc');
    });
  });

  describe('📊 Cas limites et edge cases', () => {
    it('devrait gérer différents types de fichiers', async () => {
      const testCases = [
        { content: 'Text content', name: 'text.txt', type: 'text/plain' },
        { content: JSON.stringify({data: 'test'}), name: 'data.json', type: 'application/json' },
        { content: '<html><body>Test</body></html>', name: 'page.html', type: 'text/html' },
      ];

      for (const testCase of testCases) {
        // Arrange
        const file = new File([testCase.content], testCase.name, { type: testCase.type });
        const request = { file, baseUrl: 'https://uploadhaven.dev' };

        // Act
        const result = await useCase.execute(request);

        // Assert
        const clientMetadata = result.encryptedFile.clientMetadata;
        expect(clientMetadata.mimeType).toBe(testCase.type);
        expect(clientMetadata.filename).toBe(testCase.name);
        expect(result.shareUrl).toContain('/s/');
        expect(result.shareUrl).toContain('#');
      }
    });

    it('devrait générer des identifiants de fichier uniques', async () => {
      // Arrange
      const file1 = new File(['Content 1'], 'file1.txt', { type: 'text/plain' });
      const file2 = new File(['Content 2'], 'file2.txt', { type: 'text/plain' });
      
      const request1 = { file: file1, baseUrl: 'https://uploadhaven.dev' };
      const request2 = { file: file2, baseUrl: 'https://uploadhaven.dev' };

      // Act
      const result1 = await useCase.execute(request1);
      const result2 = await useCase.execute(request2);

      // Assert
      expect(result1.encryptedFile.id).not.toBe(result2.encryptedFile.id);
      expect(result1.shareUrl).not.toBe(result2.shareUrl);
      
      // Les deux URLs doivent avoir des IDs différents
      const url1 = new URL(result1.shareUrl);
      const url2 = new URL(result2.shareUrl);
      expect(url1.pathname).not.toBe(url2.pathname);
    });    it('devrait gérer des fichiers sans type MIME', async () => {
      // Arrange
      const fileWithoutType = new File(['Content without type'], 'unknown-file');
      const request = {
        file: fileWithoutType,
        baseUrl: 'https://uploadhaven.dev'
      };

      // Act
      const result = await useCase.execute(request);

      // Assert
      const clientMetadata = result.encryptedFile.clientMetadata;
      expect(clientMetadata.filename).toBe('unknown-file');
      expect(clientMetadata.mimeType).toBe(''); // Type MIME vide pour un fichier sans type
      expect(result.encryptedFile.id).toBeDefined();
      expect(result.shareUrl).toContain('#');
    });
  });
});
