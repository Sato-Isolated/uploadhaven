'use client';

import { motion } from 'motion/react';
import { Files, HardDrive, Database, Clock } from 'lucide-react';
import { StatsGridProps } from '../types';
import { useTranslations } from 'next-intl';

export default function StatsGrid({ stats }: StatsGridProps) {
  const t = useTranslations('Stats');

  const statItems = [
    {
      icon: Files,
      label: t('totalFiles'),
      value: stats.totalFiles,
      color: 'text-blue-500',
    },
    {
      icon: HardDrive,
      label: t('storageUsed'),
      value: stats.totalSize,
      color: 'text-green-500',
    },
    {
      icon: Database,
      label: t('uploads24h'),
      value: stats.last24hUploads,
      color: 'text-purple-500',
    },
    {
      icon: Clock,
      label: t('totalDownloads'),
      value: stats.totalDownloads,
      color: 'text-orange-500',
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="space-y-2 rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50/50 to-white p-4 dark:border-gray-800 dark:from-gray-800/50 dark:to-gray-900/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
          whileHover={{
            scale: 1.02,
            boxShadow:
              '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut',
              }}
            >
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </motion.div>
            <span className="text-muted-foreground text-sm">{stat.label}</span>
          </div>
          <motion.div
            className="text-2xl font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 1 + index * 0.1,
              type: 'spring',
              stiffness: 200,
              damping: 10,
            }}
          >
            {stat.value}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}
