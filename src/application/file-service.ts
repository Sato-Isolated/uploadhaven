import { FileRepository } from '../domains/file/file-repository';
import { ShareRepository } from '../domains/share/share-repository';
import { StorageService } from '../domains/storage/storage-service';
import { CryptoService } from '../domains/security/crypto-service';
import { FileEntity } from '../domains/file/file-entity';
import { ShareEntity } from '../domains/share/share-entity';
import { 
  FileUploadRequest, 
  FileUploadResult, 
  FileDownloadRequest, 
  FileDownloadResult 
} from '../domains/file/file-value-objects';

export class FileService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly shareRepository: ShareRepository,
    private readonly storageService: StorageService,
    private readonly cryptoService: CryptoService,
    private readonly baseUrl: string
  ) {}

  async uploadFile(request: FileUploadRequest): Promise<FileUploadResult> {
    // Convert File to ArrayBuffer
    const fileBuffer = await request.file.arrayBuffer();
    
    // Encrypt the file
    const encryptionResult = await this.cryptoService.encryptFile(fileBuffer, request.password);
    
    // Create file entity
    const fileEntity = FileEntity.create({
      originalName: request.file.name,
      mimeType: request.file.type,
      size: request.file.size,
      encryptedPath: '', // Will be set after storage
      expirationHours: request.expirationHours,
      maxDownloads: request.maxDownloads,
    });

    // Generate storage path and save encrypted file
    const storagePath = this.storageService.generatePath(fileEntity.id);
    
    // Combine encrypted data with metadata
    const combinedData = this.combineEncryptedData(
      encryptionResult.encryptedData,
      encryptionResult.iv,
      encryptionResult.salt
    );
    
    await this.storageService.save(combinedData, storagePath);
    
    // Update file entity with storage path (keeping same ID)
    const updatedFileEntity = fileEntity.updateEncryptedPath(storagePath);

    // Save to database
    await this.fileRepository.save(updatedFileEntity);

    // Create share entity
    const shareEntity = ShareEntity.create({
      fileId: updatedFileEntity.id,
      baseUrl: this.baseUrl,
      expirationHours: request.expirationHours,
      passwordProtected: !!request.password,
    });

    await this.shareRepository.save(shareEntity);

    return {
      fileId: updatedFileEntity.id,
      shareUrl: shareEntity.shareUrl,
      expiresAt: updatedFileEntity.expiresAt,
    };
  }

  async downloadFile(request: FileDownloadRequest): Promise<FileDownloadResult> {
    // Find file
    const file = await this.fileRepository.findById(request.fileId);
    if (!file) {
      throw new Error('File not found');
    }

    if (!file.canBeDownloaded()) {
      throw new Error('File cannot be downloaded (expired or max downloads reached)');
    }

    // Read encrypted file from storage
    const combinedData = await this.storageService.read(file.encryptedPath);
    const { encryptedData, iv, salt } = this.separateEncryptedData(combinedData);

    // Decrypt file
    const decryptedData = await this.cryptoService.decryptFile(
      encryptedData,
      iv,
      salt,
      request.password
    );

    // Increment download count
    await this.fileRepository.incrementDownloadCount(file.id);

    return {
      fileName: file.originalName,
      mimeType: file.mimeType,
      content: decryptedData,
    };
  }

  async getFileInfo(fileId: string) {
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    return {
      id: file.id,
      originalName: file.originalName,
      size: file.size,
      uploadedAt: file.uploadedAt,
      expiresAt: file.expiresAt,
      downloadCount: file.downloadCount,
      maxDownloads: file.maxDownloads,
      canBeDownloaded: file.canBeDownloaded(),
    };
  }

  private combineEncryptedData(encryptedData: ArrayBuffer, iv: Uint8Array, salt: Uint8Array): ArrayBuffer {
    const combined = new Uint8Array(4 + salt.length + 4 + iv.length + encryptedData.byteLength);
    let offset = 0;

    // Salt length (4 bytes)
    new DataView(combined.buffer).setUint32(offset, salt.length, true);
    offset += 4;

    // Salt
    combined.set(salt, offset);
    offset += salt.length;

    // IV length (4 bytes)
    new DataView(combined.buffer).setUint32(offset, iv.length, true);
    offset += 4;

    // IV
    combined.set(iv, offset);
    offset += iv.length;

    // Encrypted data
    combined.set(new Uint8Array(encryptedData), offset);

    return combined.buffer;
  }

  private separateEncryptedData(combinedData: ArrayBuffer): {
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
    salt: Uint8Array;
  } {
    const view = new DataView(combinedData);
    let offset = 0;

    // Read salt length
    const saltLength = view.getUint32(offset, true);
    offset += 4;

    // Read salt
    const salt = new Uint8Array(combinedData, offset, saltLength);
    offset += saltLength;

    // Read IV length
    const ivLength = view.getUint32(offset, true);
    offset += 4;

    // Read IV
    const iv = new Uint8Array(combinedData, offset, ivLength);
    offset += ivLength;

    // Read encrypted data
    const encryptedData = combinedData.slice(offset);

    return { encryptedData, iv, salt };
  }
}
