'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import { uploadFileZK } from '@/lib/upload/zk-upload-utils';

// Internal imports
import type { UploadedFile } from '@/components/domains/upload/fileuploader/types';
import {
  getFileType,
  copyToClipboard,
  saveFileToLocalStorage,
} from '@/components/domains/upload/fileuploader/utils';

// External imports
import { scanFile, logSecurityEvent } from '@/lib/core/security';
import { validateFileAdvanced } from '@/lib/core/utils';

export interface UseFileUploaderReturn {
  // State
  files: UploadedFile[];
  expiration: string;
  isPasswordProtected: boolean;
  isDragActive: boolean;
  // Dropzone props
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  // Handlers
  setExpiration: (expiration: string) => void;
  setIsPasswordProtected: (isProtected: boolean) => void;
  handleCopyToClipboard: (url: string, label?: string) => Promise<void>;
  removeFile: (id: string) => void;
}

export function useFileUploader(): UseFileUploaderReturn {
  const t = useTranslations('Upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [expiration, setExpiration] = useState('24h');  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const uploadFile = useCallback(
    async (uploadedFile: UploadedFile) => {
      try {
        // Update file status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: 'uploading' } : f
          )
        );

        // Use the new ZK upload system
        const result = await uploadFileZK(uploadedFile.file, {
          expiration,
          autoGenerateKey: isPasswordProtected,
        });

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Update file with completed status
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: 'completed',
                  progress: 100,
                  url: result.url,
                  shortUrl: result.shortUrl,
                  generatedKey: result.data?.generatedKey,
                }
              : f
          )
        );

        // Save to localStorage for FileManager with expiration info
        const fileInfo = {
          name: result.data?.filename || uploadedFile.file.name,
          size: uploadedFile.file.size,
          uploadDate: new Date().toISOString(),
          type: getFileType(uploadedFile.file.name),
          expiresAt: result.data?.expiresAt,
        };

        saveFileToLocalStorage(fileInfo);

        toast.success(t('fileUploadedSuccessfully'));
        
        // Show generated key if file is password protected
        if (result.data?.generatedKey) {
          toast.success(t('generatedKey', { key: result.data.generatedKey }), {
            duration: 10000, // Show for 10 seconds
          });
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: 'error',
                  error:
                    error instanceof Error ? error.message : t('uploadFailed'),
                }
              : f
          )
        );
        toast.error(t('failedToUploadFile'));
      }
    },
    [expiration, isPasswordProtected, t]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const validFiles: File[] = [];

      for (const file of acceptedFiles) {
        // Use advanced file validation
        const validation = validateFileAdvanced(file);

        if (!validation.isValid) {
          // Log security events for validation failures
          validation.errors.forEach((error) => {
            logSecurityEvent(
              'invalid_file',
              `File ${file.name} rejected: ${error}`,
              'medium',
              {
                filename: file.name,
                fileSize: file.size,
                fileType: file.type,
              }
            );
          });

          // Show first error to user
          toast.error(`${file.name}: ${validation.errors[0]}`);
          continue;
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => {
            toast.warning(`${file.name}: ${warning}`);
          });
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      // Create initial file entries with scanning status
      const newFiles = validFiles.map((file) => ({
        id: nanoid(),
        file,
        progress: 0,
        status: 'scanning' as const,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      // Scan each file for security threats
      for (const uploadedFile of newFiles) {
        try {
          const scanResult = await scanFile(uploadedFile.file);

          if (!scanResult.safe) {
            // File contains threats
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: 'threat_detected',
                      scanResult,
                      error:
                        scanResult.threat ||
                        t('securityThreatDetected', {
                          threat: t('unknownError'),
                        }),
                    }
                  : f
              )
            );
            toast.error(
              t('securityThreatInFile', { filename: uploadedFile.file.name })
            );
            continue;
          }

          // File is safe, proceed to upload
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: 'uploading', scanResult }
                : f
            )
          );

          // Start upload
          uploadFile({ ...uploadedFile, status: 'uploading', scanResult });
        } catch (error) {
          logSecurityEvent(
            'suspicious_activity',
            `File scan failed for ${uploadedFile.file.name}: ${error}`,
            'high',
            {
              filename: uploadedFile.file.name,
              fileSize: uploadedFile.file.size,
              fileType: uploadedFile.file.type,
            }
          );

          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: 'error', error: t('securityScanFailed') }
                : f
            )
          );          toast.error(
            t('failedToScanFile', { filename: uploadedFile.file.name })
          );
        }
      }
    },
    [uploadFile, t]
  );

  const handleCopyToClipboard = useCallback(
    async (url: string, label: string = 'URL') => {
      const result = await copyToClipboard(url, label);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    },
    []
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/zip': ['.zip'],
      'video/mp4': ['.mp4'],
      'audio/mpeg': ['.mp3'],
    },
  });

  return {
    // State
    files,
    expiration,
    isPasswordProtected,
    isDragActive,

    // Dropzone props
    getRootProps,
    getInputProps,

    // Handlers
    setExpiration,
    setIsPasswordProtected,
    handleCopyToClipboard,
    removeFile,
  };
}
