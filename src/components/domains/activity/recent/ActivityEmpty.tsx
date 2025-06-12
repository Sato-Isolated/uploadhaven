'use client';

import { Activity } from 'lucide-react';

export default function ActivityEmpty() {
  return (
    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
      <Activity className="mx-auto mb-4 h-16 w-16 opacity-30" />
      <p className="text-lg font-medium">No activities found</p>
      <p className="mt-1 text-sm">Activity will appear here as it happens</p>
    </div>
  );
}
