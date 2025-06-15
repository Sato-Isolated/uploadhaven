// components/DashboardHeader.tsx - Dashboard header with user info and navigation

'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SignOutButton from '@/components/domains/auth/SignOutButton';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { NotificationDropdown } from '@/components/domains/notifications/NotificationDropdown';
import { Upload, User, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DashboardHeaderProps {
  userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const t = useTranslations('FileUploader');
  const tDashboard = useTranslations('Dashboard');

  return (
    <motion.div
      className="mb-8 flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="mb-3 flex items-center space-x-4">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-4 shadow-xl">
                <User className="h-8 w-8 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 opacity-30 blur"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            <div>
              <motion.h1
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-4xl font-bold text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {tDashboard('myDashboard')}
              </motion.h1>
              <motion.p
                className="mt-1 text-lg text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                {tDashboard('welcomeBack')}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {userName}
                </span>
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <ThemeToggle />
        <NotificationDropdown />
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Button className="h-11 border-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 text-white shadow-lg hover:from-blue-700 hover:to-purple-700">
              <Upload className="mr-2 h-5 w-5" />
              {t('uploadFiles')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </Link>
        <SignOutButton />
      </motion.div>
    </motion.div>
  );
}
