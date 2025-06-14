'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { BaseComponentProps } from '@/types';

interface ActivityFiltersProps extends BaseComponentProps {
  typeFilter: string;
  severityFilter: string;
  onTypeFilterChange: (value: string) => void;
  onSeverityFilterChange: (value: string) => void;
}

export default function ActivityFilters({
  typeFilter,
  severityFilter,
  onTypeFilterChange,
  onSeverityFilterChange,
}: ActivityFiltersProps) {
  const t = useTranslations('Activity');

  return (
    <div className="mt-4 flex gap-4">
      <Select value={typeFilter || 'all'} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="w-48 bg-white/60 backdrop-blur-sm dark:bg-gray-700/60">
          <SelectValue placeholder={t('filterByType')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allTypes')}</SelectItem>
          <SelectItem value="file_upload">{t('fileUpload')}</SelectItem>
          <SelectItem value="file_download">{t('fileDownload')}</SelectItem>
          <SelectItem value="user_registration">
            {t('userRegistration')}
          </SelectItem>
          <SelectItem value="user_login">{t('userLogin')}</SelectItem>
          <SelectItem value="user_logout">{t('userLogout')}</SelectItem>
          <SelectItem value="malware_detected">
            {t('malwareDetected')}
          </SelectItem>
          <SelectItem value="suspicious_activity">
            {t('suspiciousActivity')}
          </SelectItem>
          <SelectItem value="rate_limit">{t('rateLimit')}</SelectItem>
          <SelectItem value="invalid_file">{t('invalidFile')}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={severityFilter || 'all'}
        onValueChange={onSeverityFilterChange}
      >
        <SelectTrigger className="w-48 bg-white/60 backdrop-blur-sm dark:bg-gray-700/60">
          <SelectValue placeholder={t('filterBySeverity')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('allSeverities')}</SelectItem>
          <SelectItem value="low">{t('low')}</SelectItem>
          <SelectItem value="medium">{t('medium')}</SelectItem>
          <SelectItem value="high">{t('high')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
