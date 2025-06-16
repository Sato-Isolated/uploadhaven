// EmptyState.tsx - Empty state component when no files are present

'use client';

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function EmptyState() {
  const tFiles = useTranslations('Files');
  const tDashboard = useTranslations('Dashboard');
  const tStats = useTranslations('Stats');

  return (
    <motion.div
      className="mx-auto w-full max-w-4xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-lg dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {tStats('fileManager')}
                </CardTitle>
                <CardDescription className="text-base">
                  {tFiles('manageFiles')}
                </CardDescription>
              </div>
            </div>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            className="py-16 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.div
              className="relative mx-auto mb-8 h-24 w-24"
              animate={{
                y: [0, -15, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="relative">
                <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-6 shadow-lg backdrop-blur-sm">
                  <FileText className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute -inset-2 animate-pulse rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 opacity-50 blur-xl" />
              </div>
            </motion.div>
            <motion.h3
              className="mb-3 text-2xl font-bold text-gray-900 dark:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {tFiles('noFilesYet')}
            </motion.h3>
            <motion.p
              className="text-muted-foreground mx-auto mb-8 max-w-md text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              {tFiles('startByUploadingDescription')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={() => (window.location.href = '/')}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                >
                  {tDashboard('uploadFirstFile')}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
