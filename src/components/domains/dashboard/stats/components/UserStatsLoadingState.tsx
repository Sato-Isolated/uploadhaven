import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function UserStatsLoadingState() {
  return (
    <motion.div
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="pb-2">
              <motion.div
                className="h-4 w-24 rounded bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </CardHeader>
            <CardContent>
              <motion.div
                className="h-8 w-16 rounded bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
