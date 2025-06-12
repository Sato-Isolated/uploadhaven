'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Settings } from 'lucide-react';

interface UploadHeaderProps {
  onToggleSettings: () => void;
}

export function UploadHeader({ onToggleSettings }: UploadHeaderProps) {
  return (
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
              <Upload className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl">Upload Files</CardTitle>
              <CardDescription className="text-base">
                Drag & drop files or click to browse
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSettings}
              className="bg-white/50 backdrop-blur-sm dark:bg-gray-900/50"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Link href="/dashboard/files">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/50 backdrop-blur-sm dark:bg-gray-900/50"
              >
                View All Files
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </CardHeader>
  );
}
