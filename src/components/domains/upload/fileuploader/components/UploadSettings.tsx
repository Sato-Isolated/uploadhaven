// components/UploadSettings.tsx - Settings for expiration and password protection

'use client';

import { motion } from 'motion/react';
import { Clock, Shield, Check } from 'lucide-react';
import { EXPIRATION_OPTIONS } from '../types';
import type { UploadSettingsProps } from '../types';

export default function UploadSettings({
  expiration,
  isPasswordProtected,
  onExpirationChange,
  onPasswordProtectionChange,
}: UploadSettingsProps) {
  return (
    <motion.div
      className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50 p-8 dark:border-gray-700/50 dark:from-gray-800/50 dark:to-gray-900/50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      <div className="grid gap-8 md:grid-cols-2">
        {/* Enhanced Expiration Selector */}
        <motion.div
          className="group rounded-2xl border border-white/60 bg-gradient-to-br from-white to-blue-50/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 dark:border-gray-700/60 dark:from-gray-800 dark:to-blue-950/20"
          whileHover={{ scale: 1.02, y: -2 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="mb-4 flex items-center space-x-3">
            <motion.div
              className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-2 shadow-md"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Clock className="h-5 w-5 text-white" />
            </motion.div>
            <label className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-lg font-semibold text-transparent dark:from-white dark:to-gray-200">
              File Expiration
            </label>
          </div>
          <select
            value={expiration}
            onChange={(e) => onExpirationChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200/60 bg-white/80 p-4 font-medium text-gray-900 backdrop-blur-sm transition-all duration-300 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/60 dark:border-gray-700/60 dark:bg-gray-900/80 dark:text-white"
          >
            {EXPIRATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <motion.p
            className="mt-3 text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Files will be automatically deleted after this time
          </motion.p>
        </motion.div>

        {/* Enhanced Password Protection */}
        <motion.div
          className="group rounded-2xl border border-white/60 bg-gradient-to-br from-white to-purple-50/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 dark:border-gray-700/60 dark:from-gray-800 dark:to-purple-950/20"
          whileHover={{ scale: 1.02, y: -2 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="mb-4 flex items-center space-x-3">
            <motion.div
              className="rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 p-2 shadow-md"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Shield className="h-5 w-5 text-white" />
            </motion.div>
            <label className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-lg font-semibold text-transparent dark:from-white dark:to-gray-200">
              Security Protection
            </label>
          </div>
          <motion.label
            className="flex cursor-pointer items-center space-x-4 rounded-xl border border-gray-200/40 bg-white/60 p-4 transition-all duration-300 hover:bg-white/80 dark:border-gray-700/40 dark:bg-gray-900/60 dark:hover:bg-gray-900/80"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <motion.input
              type="checkbox"
              checked={isPasswordProtected}
              onChange={(e) => onPasswordProtectionChange(e.target.checked)}
              className="h-5 w-5 rounded-lg border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 dark:border-gray-600"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
            <span className="flex-1 text-base font-medium text-gray-700 dark:text-gray-300">
              Auto-generate access key
            </span>
            {isPasswordProtected && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-full bg-gradient-to-br from-green-500 to-emerald-500 p-1"
              >
                <Check className="h-3 w-3 text-white" />
              </motion.div>
            )}
          </motion.label>
          <motion.p
            className="mt-3 text-sm text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            Protect your files with an automatically generated key
          </motion.p>
        </motion.div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-gray-200/50 pt-6 dark:border-gray-700/50">
        <div className="flex items-center space-x-3">
          <p className="text-muted-foreground text-xs">
            {isPasswordProtected
              ? '🔑 A secure key will protect your files'
              : '🌐 Public access via link sharing'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
