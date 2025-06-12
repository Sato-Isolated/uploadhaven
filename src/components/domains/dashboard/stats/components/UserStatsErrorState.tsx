import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface UserStatsErrorStateProps {
  error?: Error | null;
}

export function UserStatsErrorState({ error }: UserStatsErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 border-red-200 bg-gradient-to-br from-red-50 to-red-100 shadow-lg dark:border-red-800 dark:from-red-950 dark:to-red-900">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <motion.div
              className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-2"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">
                Unable to load statistics
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
