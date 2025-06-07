// components/FileUploaderHeader.tsx - Header section with branding and features

"use client";

import { motion } from "motion/react";
import { CloudUpload } from "lucide-react";

export default function FileUploaderHeader() {
  return (
    <motion.div
      className="text-center space-y-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="flex items-center justify-center space-x-4 mb-6"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl shadow-xl">
            <CloudUpload className="h-10 w-10 text-white" />
          </div>
          <motion.div
            className="absolute -inset-2 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl opacity-30 blur"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
        <div>
          <motion.h1
            className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            UploadHaven
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600 dark:text-gray-400 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Secure file sharing made simple
          </motion.p>
        </div>
      </motion.div>

      <motion.div
        className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>100 MiB max upload</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Secure & encrypted</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span>Auto-expiration</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
