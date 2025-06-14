// components/FileUploaderHeader.tsx - Header section with branding and features

'use client';

import { motion } from 'motion/react';
import { CloudUpload } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function FileUploaderHeader() {
  const t = useTranslations('FileUploader');

  return (
    <motion.div
      className="space-y-6 text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="mb-6 flex items-center justify-center space-x-4"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="rounded-3xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 p-4 shadow-xl">
            <CloudUpload className="h-10 w-10 text-white" />
          </div>
          <motion.div
            className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 opacity-30 blur"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
        <div>
          <motion.h1
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            {t('title')}
          </motion.h1>
          <motion.p
            className="mt-2 text-xl text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {t('subtitle')}
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span>{t('maxFileSize')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span>{t('secureAndFast')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
          <span>{t('autoDelete')}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
