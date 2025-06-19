// EmptyState.tsx - Composant d'état vide réutilisable
// Responsibility: Afficher des messages d'état vide avec style cohérent

'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import type { BaseComponentProps } from '@/types';

interface EmptyStateProps extends BaseComponentProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'subtle' | 'gradient';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-800/50 dark:via-blue-900/20 dark:to-purple-900/20 border-0';
      case 'subtle':
        return 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/60 dark:border-gray-700/60';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className={`shadow-sm ${getVariantClasses()}`}>
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {/* Icon with animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <div className="rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 p-6 shadow-lg">
              <Icon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            {title}
          </motion.h3>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400"
          >
            {description}
          </motion.p>

          {/* Action Button */}
          {onAction && actionLabel && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button
                onClick={onAction}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                {actionLabel}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default EmptyState;
