import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SecurityEventsHeaderProps {
  eventCount: number;
  onToggleFilters: () => void;
}

export function SecurityEventsHeader({
  eventCount,
  onToggleFilters,
}: SecurityEventsHeaderProps) {
  const t = useTranslations('Security');

  return (
    <CardHeader>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('recentSecurityEvents', { count: eventCount })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('filters')}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
