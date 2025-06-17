'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSession } from '@/lib/auth/auth-client';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';
import { createZKFormData } from '@/lib/upload/zk-upload-utils';

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
  const [expiration, setExpiration] = useState('24h');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const { data: session } = useSession();

  const uploadFile = useCallback(
    async (uploadedFile: UploadedFile) => {
      try {
        // Step 1: Create ZK encrypted FormData
        const formData = await createZKFormData(uploadedFile.file, {
          expiration,
          autoGenerateKey: isPasswordProtected,
        });

        // Include user ID if authenticated
        if (session?.user?.id) {
          formData.append('userId', session.user.id);
        }

        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id ? { ...f, progress } : f
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: 'completed',
                      progress: 100,
                      url: response.url,
                      shortUrl: response.shortUrl,
                      generatedKey: response.generatedKey,
                    }
                  : f
              )
            );

            // Save to localStorage for FileManager with expiration info
            const fileInfo = {
              name: response.filename,
              size: uploadedFile.file.size,
              uploadDate: new Date().toISOString(),
              type: getFileType(uploadedFile.file.name),
              expiresAt: response.expiresAt,
            };

            saveFileToLocalStorage(fileInfo);

            toast.success(t('fileUploadedSuccessfully'));
            // Show generated key if file is password protected
            if (response.generatedKey) {
              toast.success(t('generatedKey', { key: response.generatedKey }), {
                duration: 10000, // Show for 10 seconds
              });
            }
          } else {
            // Parse server error response to get specific error message
            let errorMessage = t('uploadFailedWithStatus', {
              status: xhr.status,
              statusText: xhr.statusText,
            });
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              if (errorResponse.error) {
                errorMessage = errorResponse.error;
              }
            } catch {
              // If response isn't JSON, use default error message
            }
            throw new Error(errorMessage);
          }
        };

        xhr.onerror = () => {
          throw new Error(t('uploadFailed'));
        };

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
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
    [expiration, session?.user?.id, isPasswordProtected]
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
          );
          toast.error(
            t('failedToScanFile', { filename: uploadedFile.file.name })
          );
        }
      }
    },
    [uploadFile]
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
