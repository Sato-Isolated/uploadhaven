export interface EncryptedFileData {
  encryptedContent: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
}

export interface FileUploadRequest {
  file: File;
  password?: string;
  expirationHours?: number;
  maxDownloads?: number;
}

export interface FileUploadResult {
  fileId: string;
  shareUrl: string;
  expiresAt: Date;
}

export interface FileDownloadRequest {
  fileId: string;
  password?: string;
}

export interface FileDownloadResult {
  fileName: string;
  mimeType: string;
  content: ArrayBuffer;
}
