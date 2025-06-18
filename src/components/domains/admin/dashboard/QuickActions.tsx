'use client';

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield } from 'lucide-react';

// Security scan functionality removed as part of zero-knowledge architecture
// This component now serves as a placeholder for future admin quick actions

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {/* Security scan functionality removed as part of zero-knowledge architecture */}
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <Shield className="mx-auto mb-2 h-8 w-8" />
              Security scanning disabled for zero-knowledge architecture
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
