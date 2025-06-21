'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import type { NotificationType, NotificationPriority } from '@/types/events';

interface NotificationFiltersProps {
  selectedTypes: NotificationType[];
  selectedPriorities: NotificationPriority[];
  includeRead: boolean;
  onTypeToggle: (type: NotificationType) => void;
  onPriorityToggle: (priority: NotificationPriority) => void;
  onIncludeReadToggle: () => void;
  onClearFilters: () => void;
  className?: string;
}

/**
 * NotificationFilters - Focused component for filtering notifications
 * 
 * Single Responsibility: Handle notification filtering controls
 * - Provides type-based filtering
 * - Handles priority-based filtering
 * - Manages read/unread filtering
 * - Shows active filter indicators
 */
export function NotificationFilters({
  selectedTypes,
  selectedPriorities,
  includeRead,
  onTypeToggle,
  onPriorityToggle,
  onIncludeReadToggle,
  onClearFilters,
  className = '',
}: NotificationFiltersProps) {
  const t = useTranslations('Notifications');

  const notificationTypes: NotificationType[] = [
    'file_downloaded',
    'file_expired_soon',
    'file_shared',
    'security_alert',
    'system_announcement',
    'file_upload_complete',
    'bulk_action_complete',
  ];

  const notificationPriorities: NotificationPriority[] = [
    'low',
    'normal',
    'high',
    'urgent',
  ];

  const getTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case 'file_downloaded':
        return t('types.fileDownloaded');
      case 'file_expired_soon':
        return t('types.fileExpiredSoon');
      case 'file_shared':
        return t('types.fileShared');
      case 'security_alert':
        return t('types.securityAlert');
      case 'system_announcement':
        return t('types.systemAnnouncement');
      case 'file_upload_complete':
        return t('types.fileUploadComplete');
      case 'bulk_action_complete':
        return t('types.bulkActionComplete');
      default:
        return type;
    }
  };

  const getPriorityLabel = (priority: NotificationPriority): string => {
    switch (priority) {
      case 'low':
        return t('priorities.low');
      case 'normal':
        return t('priorities.normal');
      case 'high':
        return t('priorities.high');
      case 'urgent':
        return t('priorities.urgent');
      default:
        return priority;
    }
  };

  const activeFiltersCount = selectedTypes.length + selectedPriorities.length + (includeRead ? 0 : 1);
  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('filters')}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {/* Read/Unread Filter */}
          <DropdownMenuCheckboxItem
            checked={includeRead}
            onCheckedChange={onIncludeReadToggle}
          >
            {t('includeRead')}
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />

          {/* Type Filters */}
          <div className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('filterByType')}
          </div>
          {notificationTypes.map((type) => (
            <DropdownMenuCheckboxItem
              key={type}
              checked={selectedTypes.includes(type)}
              onCheckedChange={() => onTypeToggle(type)}
            >
              {getTypeLabel(type)}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          {/* Priority Filters */}
          <div className="px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('filterByPriority')}
          </div>
          {notificationPriorities.map((priority) => (
            <DropdownMenuCheckboxItem
              key={priority}
              checked={selectedPriorities.includes(priority)}
              onCheckedChange={() => onPriorityToggle(priority)}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    priority === 'urgent'
                      ? 'bg-red-500'
                      : priority === 'high'
                      ? 'bg-orange-500'
                      : priority === 'normal'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                  }`}
                />
                {getPriorityLabel(priority)}
              </span>
            </DropdownMenuCheckboxItem>
          ))}

          {hasActiveFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onClearFilters}>
                <X className="h-4 w-4 mr-2" />
                {t('clearFilters')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          {selectedTypes.map((type) => (
            <Badge
              key={type}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              {getTypeLabel(type)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => onTypeToggle(type)}
              />
            </Badge>
          ))}
          {selectedPriorities.map((priority) => (
            <Badge
              key={priority}
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              {getPriorityLabel(priority)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => onPriorityToggle(priority)}
              />
            </Badge>
          ))}
          {!includeRead && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              {t('unreadOnly')}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={onIncludeReadToggle}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationFilters;
