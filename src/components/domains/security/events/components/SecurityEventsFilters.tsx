import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface SecurityEventsFiltersProps {
  searchTerm: string;
  severityFilter: string;
  typeFilter: string;
  onSearchChange: (term: string) => void;
  onSeverityChange: (severity: string) => void;
  onTypeChange: (type: string) => void;
  onClearFilters: () => void;
}

export function SecurityEventsFilters({
  searchTerm,
  severityFilter,
  typeFilter,
  onSearchChange,
  onSeverityChange,
  onTypeChange,
  onClearFilters,
}: SecurityEventsFiltersProps) {
  const t = useTranslations('Security');

  return (
    <div className="mt-4 space-y-4 rounded-lg border bg-gray-50 p-4 dark:bg-gray-800">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder={t('searchEventsIpsFilenames')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={severityFilter} onValueChange={onSeverityChange}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder={t('severity')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allSeverities')}</SelectItem>
            <SelectItem value="low">{t('low')}</SelectItem>
            <SelectItem value="medium">{t('medium')}</SelectItem>
            <SelectItem value="high">{t('high')}</SelectItem>
            <SelectItem value="critical">{t('critical')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t('eventType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTypes')}</SelectItem>
            <SelectItem value="rate_limit">{t('rateLimit')}</SelectItem>
            <SelectItem value="invalid_file">{t('invalidFile')}</SelectItem>
            <SelectItem value="blocked_ip">{t('blockedIp')}</SelectItem>
            <SelectItem value="malware_detected">{t('malware')}</SelectItem>
            <SelectItem value="large_file">{t('largeFile')}</SelectItem>
            <SelectItem value="access_denied">{t('accessDenied')}</SelectItem>
            <SelectItem value="suspicious_activity">
              {t('suspicious')}
            </SelectItem>
            <SelectItem value="system_maintenance">
              {t('systemMaintenance')}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
