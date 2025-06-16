'use client';

import { useCallback, useState } from 'react';
import { useSession } from '@/lib/auth/auth-client';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useTranslations } from 'next-intl';

// Import types and utilities
import type { UploadedFile } from '@/components/domains/upload/fileuploader/types';
import {
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
} from '@/components/domains/upload/fileuploader/types';
import {
  getFileType,
  saveFileToLocalStorage,
} from '@/components/domains/upload/fileuploader/utils';
import { scanFile, logSecurityEvent } from '@/lib/core/security';
import { validateFileAdvanced } from '@/lib/core/utils';

export function useDashboardUpload() {
  const t = useTranslations('Upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [expiration, setExpiration] = useState('24h');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { data: session } = useSession();

  const uploadFile = useCallback(
    async (uploadedFile: UploadedFile) => {
      try {
        const formData = new FormData();
        formData.append('file', uploadedFile.file);
        formData.append('expiration', expiration);

        if (isPasswordProtected) {
          formData.append('autoGenerateKey', 'true');
        }
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
                      url: response.downloadUrl,
                      shortUrl: response.shortUrl,
                      generatedKey: response.generatedKey,
                    }
                  : f
              )
            );
            toast.success(t('fileUploadedSuccessfully'));

            if (session?.user?.id) {
              const fileInfo = {
                name: response.filename,
                size: uploadedFile.file.size,
                uploadDate: new Date().toISOString(),
                type: getFileType(uploadedFile.file.name),
                expiresAt: response.expiresAt,
              };
              saveFileToLocalStorage(fileInfo);
            }
          } else {
            const errorResponse = JSON.parse(xhr.responseText);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: 'error',
                      error: errorResponse.error || t('uploadFailed'),
                    }
                  : f
              )
            );
            toast.error(
              `${t('uploadFailed')}: ${errorResponse.error || t('unknownError')}`
            );
          }
        };

        xhr.onerror = () => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: 'error', error: t('networkError') }
                : f
            )
          );
          toast.error(t('networkErrorDuringUpload'));
        };

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, status: 'error', error: t('uploadFailed') }
              : f
          )
        );
        toast.error(t('failedToUploadFile'));
      }
    },
    [expiration, isPasswordProtected, session]
  );

  const processFiles = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = [];

      for (const file of acceptedFiles) {
        // Validate file
        if (file.size > MAX_FILE_SIZE) {
          toast.error(t('fileTooLarge', { filename: file.name }));
          continue;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(t('fileTypeNotAllowed', { fileType: file.type }));
          continue;
        }

        const advancedValidation = await validateFileAdvanced(file);
        if (!advancedValidation.isValid) {
          toast.error(
            t('fileFailedValidation', {
              filename: file.name,
              error: advancedValidation.errors[0],
            })
          );
          continue;
        }

        const uploadedFile: UploadedFile = {
          id: nanoid(),
          file,
          progress: 0,
          status: 'scanning',
        };

        newFiles.push(uploadedFile);
      }

      setFiles((prev) => [...prev, ...newFiles]);

      // Security scan and upload each file
      for (const uploadedFile of newFiles) {
        try {
          const scanResult = await scanFile(uploadedFile.file);

          if (!scanResult.safe) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? {
                      ...f,
                      status: 'threat_detected',
                      scanResult,
                      error: t('securityThreatDetected', {
                        threat: scanResult.threat || t('unknownError'),
                      }),
                    }
                  : f
              )
            );

            logSecurityEvent(
              'malware_detected',
              `Security threat detected in ${uploadedFile.file.name}: ${scanResult.threat}`,
              'high',
              {
                filename: uploadedFile.file.name,
                fileSize: uploadedFile.file.size,
                fileType: uploadedFile.file.type,
              }
            );

            toast.error(
              t('securityThreatInFile', { filename: uploadedFile.file.name })
            );
            continue;
          }

          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id
                ? { ...f, status: 'uploading', scanResult }
                : f
            )
          );

          await uploadFile(uploadedFile);
        } catch {
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

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'completed'));
  }, []);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  return {
    // State
    files,
    expiration,
    isPasswordProtected,
    showSettings,

    // Actions
    processFiles,
    removeFile,
    clearCompleted,
    toggleSettings,
    setExpiration,
    setIsPasswordProtected,
  };
}
