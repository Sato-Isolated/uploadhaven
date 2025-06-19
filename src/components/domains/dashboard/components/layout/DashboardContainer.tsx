// DashboardContainer following SRP principles
// Responsibility: Main layout wrapper and background styling

'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { DashboardContainerProps } from '../../types';

interface DashboardContainerPropsExtended extends DashboardContainerProps {
  children: ReactNode;
  enableAnimations?: boolean;
  backgroundVariant?: 'default' | 'minimal' | 'gradient';
}

export function DashboardContainer({ 
  children, 
  className = '',
  enableAnimations = true,
  backgroundVariant = 'default'
}: DashboardContainerPropsExtended) {
  const backgroundStyles = {
    default: 'from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20',
    minimal: 'from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900',
    gradient: 'from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950'
  };

  const Container = enableAnimations ? motion.div : 'div';
  
  const animationProps = enableAnimations ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 }
  } : {};

  return (
    <Container
      className={`min-h-screen bg-gradient-to-br ${backgroundStyles[backgroundVariant]} ${className}`}
      {...animationProps}
    >
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </Container>
  );
}
