// LoadingSpinner.tsx - Spinner de chargement moderne
// Responsibility: Afficher des indicateurs de chargement élégants

'use client';

import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import type { BaseComponentProps } from '@/types';

interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'gradient' | 'dots' | 'pulse';
  message?: string;
}

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  message,
  className = '',
}: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      case 'xl':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getMessageSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      case 'xl':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-gray-600 dark:text-gray-400 ${getMessageSize()}`}
          >
            {message}
          </motion.p>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <motion.div
          className={`rounded-full bg-gradient-to-r from-blue-600 to-purple-600 ${getSizeClasses()}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-gray-600 dark:text-gray-400 ${getMessageSize()}`}
          >
            {message}
          </motion.p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {variant === 'gradient' ? (
        <motion.div
          className={`rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-1 ${getSizeClasses()}`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className="h-full w-full rounded-full bg-white dark:bg-gray-900" />
        </motion.div>
      ) : (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Loader2 className={`text-blue-600 ${getSizeClasses()}`} />
        </motion.div>
      )}
      
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-gray-600 dark:text-gray-400 ${getMessageSize()}`}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

export default LoadingSpinner;
