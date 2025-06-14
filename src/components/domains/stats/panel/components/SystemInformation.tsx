'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { SystemInformationProps } from '../types';
import { useTranslations } from 'next-intl';

export default function SystemInformation({ stats }: SystemInformationProps) {
  const t = useTranslations('Stats');

  const systemInfo = [
    { label: t('uploadDirectory'), value: '/public/uploads' },
    { label: t('maxFileSize'), value: '100 MB' },
    {
      label: t('expirationOptions'),
      value: '1h, 24h, 7d, 30d, never',
    },
    {
      label: t('allowedTypes'),
      value: t('allowedTypesValue'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="border-0 bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 shadow-lg dark:from-gray-900 dark:via-green-950/20 dark:to-blue-950/20">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="flex items-center space-x-3">
              <motion.div
                className="rounded-lg bg-gradient-to-br from-green-500 to-blue-600 p-2"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Activity className="h-5 w-5 text-white" />
              </motion.div>
              <CardTitle>{t('systemInformation')}</CardTitle>
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {systemInfo.map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
              >
                <span className="text-muted-foreground">{info.label}</span>
                <motion.div
                  className="bg-muted mt-1 rounded p-2 font-mono text-xs"
                  whileHover={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    transition: { duration: 0.2 },
                  }}
                >
                  {info.value}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
          {stats.totalFiles > 0 && (
            <motion.div
              className="text-muted-foreground mt-4 border-t pt-4 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4, duration: 0.5 }}
            >
              Average file size:
              {Math.round(stats.totalSizeBytes / stats.totalFiles)} bytes
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
