'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export function SignUpFormFooter() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
      className="space-y-4"
    >
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            Already have an account?
          </span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition-colors duration-200 group"
        >
          <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
          Sign in instead
        </Link>
      </div>

      <div className="text-center pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors duration-200 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Upload
        </Link>
      </div>
    </motion.div>
  );
}
