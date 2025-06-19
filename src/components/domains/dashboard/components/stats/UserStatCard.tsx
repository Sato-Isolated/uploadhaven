// UserStatCard following SRP principles
// Responsibility: Individual statistic card display

'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserStatCardProps } from '../../types';

interface UserStatCardPropsExtended extends UserStatCardProps {
  delay?: number;
}

export function UserStatCard({
  title,
  value,
  subtitle,
  icon: IconComponent,
  gradient,
  bgGradient,
  trend,
  delay = 0,
  className = ''
}: UserStatCardPropsExtended) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card 
        className={`border-0 bg-gradient-to-br shadow-lg ${bgGradient} backdrop-blur-sm`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          <motion.div
            className={`h-10 w-10 rounded-lg bg-gradient-to-br ${gradient} p-2 shadow-md`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <IconComponent className="h-6 w-6 text-white" />
          </motion.div>
        </CardHeader>
        <CardContent className="pt-0">
          <motion.div
            className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-gray-200"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{
              delay: delay + 0.2,
              type: 'spring',
              stiffness: 200,
            }}
          >
            {value}
          </motion.div>
          {subtitle && (
            <motion.p
              className="mt-1 text-xs text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.4, duration: 0.5 }}
            >
              {subtitle}
            </motion.p>
          )}
          {trend && (
            <motion.div
              className={`mt-2 flex items-center text-xs ${
                trend.direction === 'up' 
                  ? 'text-green-600 dark:text-green-400'
                  : trend.direction === 'down'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.6, duration: 0.5 }}
            >
              <span className="font-medium">
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                {trend.value}%
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
