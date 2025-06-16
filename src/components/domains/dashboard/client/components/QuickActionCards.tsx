// components/QuickActionCards.tsx - Quick action cards for dashboard navigation

'use client';

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Files, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function QuickActionCards() {
  const tDashboard = useTranslations('Dashboard');

  const quickActions = [
    {
      title: tDashboard('myFiles'),
      description: tDashboard('viewAndManageFiles'),
      icon: Files,
      href: '/dashboard/files',
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient:
        'from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950',
    },
    {
      title: tDashboard('analytics'),
      description: tDashboard('trackFileStats'),
      icon: TrendingUp,
      href: '/dashboard/analytics',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient:
        'from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950',
    },
  ];

  return (
    <motion.div
      className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
    >
      {quickActions.map((action, index) => {
        const IconComponent = action.icon;
        return (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{
              delay: 0.7 + index * 0.1,
              duration: 0.5,
              type: 'spring',
              stiffness: 300,
            }}
          >
            <Link href={action.href}>
              <Card
                className={`border-0 bg-gradient-to-br shadow-lg ${action.bgGradient} cursor-pointer backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      className={`bg-gradient-to-br p-3 ${action.gradient} rounded-xl shadow-md`}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
