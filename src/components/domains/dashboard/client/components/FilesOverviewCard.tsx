// components/FilesOverviewCard.tsx - Files overview section with call-to-action

'use client';

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Files, Upload, Activity, ArrowRight, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function FilesOverviewCard() {
  const t = useTranslations('Dashboard');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      <Card className="mb-8 border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-xl backdrop-blur-sm dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20">
        <CardHeader className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:border-gray-700/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-lg"
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Files className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-2xl">
                    {t('fileOverview')}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {t('quickAccessTools')}
                  </CardDescription>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/dashboard/files">
                  <Button
                    variant="outline"
                    className="bg-white/50 backdrop-blur-sm dark:bg-gray-900/50"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    {t('viewAllFiles')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="p-8">
          <motion.div
            className="py-12 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <motion.div
              className="mb-8"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 3, -3, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div className="relative mx-auto h-20 w-20">
                <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-6 shadow-lg backdrop-blur-sm">
                  <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <motion.div
                  className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 opacity-50 blur"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
            </motion.div>
            <motion.h3
              className="mb-3 text-2xl font-bold text-gray-900 dark:text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              {t('readyToStart')}
            </motion.h3>
            <motion.p
              className="mx-auto mb-8 max-w-md text-lg text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
            >
              {t('uploadFirstFilePrompt')}
            </motion.p>
            <motion.div
              className="flex flex-col justify-center gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
            >
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="h-12 border-0 bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-white shadow-lg hover:from-blue-700 hover:to-purple-700">
                    <Upload className="mr-2 h-5 w-5" />
                    {t('uploadFirstFile')}
                  </Button>
                </motion.div>
              </Link>
              <Link href="/dashboard/files">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="h-12 bg-white/50 px-8 backdrop-blur-sm dark:bg-gray-900/50"
                  >
                    <Files className="mr-2 h-5 w-5" />
                    {t('browseFiles')}
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
