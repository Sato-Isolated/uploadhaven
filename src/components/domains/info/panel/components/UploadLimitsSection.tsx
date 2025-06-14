'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HardDrive } from 'lucide-react';
import {
  createSupportedFormats,
  createExpirationOptions,
  createSupportedTypes,
  createUploadLimitItems,
} from '../utils';

export default function UploadLimitsSection() {
  const t = useTranslations('InfoPanel');
  const supportedFormats = createSupportedFormats(t);
  const expirationOptions = createExpirationOptions(t);
  const supportedTypes = createSupportedTypes(t);
  const uploadLimitItems = createUploadLimitItems(t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-100 dark:border-emerald-800 dark:from-emerald-950 dark:to-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-green-400">
              {t('uploadLimits')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Maximum file size */}
            <motion.div
              className="flex items-center justify-between rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-gray-800/60"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                {t('maximumFileSize')}
              </span>
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
              >
                {t('maxFileSize')}
              </Badge>
            </motion.div>

            {/* Supported formats */}
            <motion.div
              className="flex items-center justify-between rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-gray-800/60"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                {t('supportedFormats')}
              </span>
              <div className="flex gap-1">
                {supportedFormats.map((format, index) => (
                  <Badge
                    key={`format-${format.name}-${index}`}
                    variant="outline"
                    className={format.color}
                  >
                    {format.name}
                  </Badge>
                ))}
              </div>
            </motion.div>

            {/* Expiration options */}
            <motion.div
              className="flex items-center justify-between rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-gray-800/60"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                {t('expirationOptions')}
              </span>
              <div className="flex gap-1">
                {expirationOptions.map((option, index) => (
                  <Badge
                    key={`expiration-${option.label}-${index}`}
                    variant="outline"
                    className={option.color}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </motion.div>

            <Separator className="bg-emerald-200 dark:bg-emerald-800" />

            {/* Supported file types details */}
            <motion.div
              className="rounded-lg bg-white/40 p-4 text-sm text-emerald-700 backdrop-blur-sm dark:bg-gray-800/40 dark:text-emerald-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.45 }}
            >
              <p className="font-semibold">{t('supportedFileTypes')}</p>
              <ul className="mt-2 space-y-1 text-xs">
                {supportedTypes.map((type, index) => (
                  <li key={`type-${type.name}-${index}`}>
                    • <strong>{type.name}:</strong> {type.extensions}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
