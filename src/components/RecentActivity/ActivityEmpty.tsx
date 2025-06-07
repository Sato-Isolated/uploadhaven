"use client";

import { Activity } from "lucide-react";

export default function ActivityEmpty() {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
      <p className="text-lg font-medium">No activities found</p>
      <p className="text-sm mt-1">Activity will appear here as it happens</p>
    </div>
  );
}
