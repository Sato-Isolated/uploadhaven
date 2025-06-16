// LoadingIndicator.tsx - Loading state component with animated skeleton cards

'use client';

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function LoadingIndicator() {
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
              <motion.div
                className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-lg"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-xl">
                  {tStats('fileManager')}
                </CardTitle>
                <CardDescription className="text-base">
                  {tStats('loadingFiles')}
                </CardDescription>
              </div>
            </div>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-20 rounded-xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: [0.4, 1, 0.4],
                x: 0,
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                delay: i * 0.1,
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                backgroundSize: '200% 200%',
              }}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
