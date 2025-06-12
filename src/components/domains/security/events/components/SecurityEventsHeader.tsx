import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface SecurityEventsHeaderProps {
  eventCount: number;
  onToggleFilters: () => void;
}

export function SecurityEventsHeader({
  eventCount,
  onToggleFilters,
}: SecurityEventsHeaderProps) {
  return (
    <CardHeader>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Security Events ({eventCount})
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
