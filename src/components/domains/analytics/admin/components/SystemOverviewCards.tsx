'use client';

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';

interface SystemOverviewData {
  totalFiles: number;
  filesLast24h: number;
  totalUsers: number;
  activeUsers: number;
  totalStorage: string;
  totalDownloads: number;
}

interface SystemOverviewCardsProps {
  systemOverview: SystemOverviewData;
}

export function SystemOverviewCards({
  systemOverview,
}: SystemOverviewCardsProps) {
  const cards = [
    {
      title: 'Total Files',
      value: systemOverview.totalFiles.toLocaleString(),
      subtitle: `+${systemOverview.filesLast24h} today`,
      icon: '📁',
      delay: 0.1,
    },
    {
      title: 'Total Users',
      value: systemOverview.totalUsers.toLocaleString(),
      subtitle: `${systemOverview.activeUsers} active this week`,
      icon: '👥',
      delay: 0.2,
    },
    {
      title: 'Storage Used',
      value: systemOverview.totalStorage,
      subtitle: 'Across all files',
      icon: '💾',
      delay: 0.3,
    },
    {
      title: 'Total Downloads',
      value: systemOverview.totalDownloads.toLocaleString(),
      subtitle: 'All time downloads',
      icon: '⬇️',
      delay: 0.4,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                </div>
                <div className="text-3xl">{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
