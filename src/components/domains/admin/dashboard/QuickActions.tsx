'use client';

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface QuickActionsProps {
  onSecurityScan: () => void;
}

export default function QuickActions({ onSecurityScan }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>{' '}
        </CardHeader>{' '}
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {/* Only Security Scan remains - System Logs removed as it duplicated ActivityOverview */}
            <Button
              variant="outline"
              className="flex h-auto flex-col gap-3 border-orange-200 bg-gradient-to-br from-orange-50 to-red-100 p-6 transition-all duration-200 hover:from-orange-100 hover:to-red-200 dark:border-orange-800 dark:from-orange-950 dark:to-red-900 dark:hover:from-orange-900 dark:hover:to-red-800"
              onClick={onSecurityScan}
            >
              <Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Security Scan
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
