'use client';

import { motion } from 'motion/react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export function SignUpFormHeader() {
  return (
    <CardHeader className="relative z-10 space-y-4 pb-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg"
      >
        <Upload className="h-8 w-8 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <CardTitle className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent dark:from-white dark:to-gray-300">
          Join UploadHaven
        </CardTitle>
        <CardDescription className="mt-2 text-gray-600 dark:text-gray-400">
          Create your account to manage files and get extended storage
        </CardDescription>
      </motion.div>
    </CardHeader>
  );
}
