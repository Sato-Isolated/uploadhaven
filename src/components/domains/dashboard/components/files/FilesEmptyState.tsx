// FilesEmptyState.tsx - Empty state component for files (SRP)

'use client';

import { motion } from 'motion/react';
import { Upload, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';
import type { FilesEmptyStateProps } from './types';

/**
 * FilesEmptyState - Empty state component for when no files exist
 * Responsibilities:
 * - Displaying empty state message
 * - Providing call-to-action for uploading files
 * - Engaging animations and design
 */
export default function FilesEmptyState({ className = '' }: FilesEmptyStateProps) {
  const t = useTranslations('Files');

  const handleUploadClick = () => {
    // Scroll to upload area or trigger upload modal
    const uploadArea = document.querySelector('[data-upload-area]');
    if (uploadArea) {
      uploadArea.scrollIntoView({ behavior: 'smooth' });
    }
  };  return (
    <div className={`h-[500px] flex flex-col ${className}`}>
      <motion.div
        className="h-full w-full max-w-2xl mx-auto flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-lg dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 flex flex-col h-full">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center flex-1">
            {/* Animated Icons */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-sm"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                
                {/* Floating sparkles */}
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{
                    y: [-2, -8, -2],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-1 -left-2"
                  animate={{
                    y: [2, -4, 2],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  <Sparkles className="h-3 w-3 text-blue-400" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Text Content */}
            <motion.div
              className="mb-8 space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('noFilesYet', { defaultValue: 'No files yet' })}
              </h3>
              <p className="max-w-md text-muted-foreground">
                {t('noFilesDescription', { 
                  defaultValue: 'Upload your first file to get started. You can drag and drop files or click the upload button above.' 
                })}
              </p>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Button
                onClick={handleUploadClick}
                className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:scale-105"
              >
                <Upload className="mr-2 h-5 w-5" />
                {t('uploadFirstFile', { defaultValue: 'Upload your first file' })}
              </Button>
            </motion.div>

            {/* Feature hints */}
            <motion.div
              className="mt-8 grid grid-cols-1 gap-4 text-sm text-muted-foreground md:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>{t('dragAndDrop', { defaultValue: 'Drag & drop support' })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span>{t('secureSharing', { defaultValue: 'Secure sharing' })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>{t('autoExpiration', { defaultValue: 'Auto expiration' })}</span>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
