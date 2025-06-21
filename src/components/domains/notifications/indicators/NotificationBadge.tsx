'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';

interface NotificationBadgeProps {
  count: number;
  variant?: 'destructive' | 'default' | 'secondary' | 'outline';
  className?: string;
  animated?: boolean;
  maxCount?: number;
}

/**
 * NotificationBadge - Focused component for displaying unread notification counts
 * 
 * Single Responsibility: Display unread count badge with animation
 * - Handles count display formatting (99+ for large numbers)
 * - Provides entrance/exit animations
 * - Configurable styling and behavior
 */
export function NotificationBadge({
  count,
  variant = 'destructive',
  className = '',
  animated = true,
  maxCount = 99,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const badgeElement = (
    <Badge
      variant={variant}
      className={`flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs ${className}`}
    >
      {displayCount}
    </Badge>
  );

  if (!animated) {
    return badgeElement;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 25,
        }}
      >
        {badgeElement}
      </motion.div>
    </AnimatePresence>
  );
}

export default NotificationBadge;
