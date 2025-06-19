'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, HardDrive, Files } from 'lucide-react';
import { formatFileSize } from '@/lib/core/utils';
import UserActionDropdown from './UserActionDropdown';
import type { UserRowProps } from './types';
import type { AdminUser } from '@/types/admin';

export default function UserRow({
  user,
  onAction,
  onViewDetails,
  onEdit,
  onRoleChange,
  onDelete,
}: UserRowProps) {
  const t = useTranslations('Admin');
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  const getStatusColor = (user: AdminUser) => {
    if (!user.isActive)
      return 'text-red-600 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30';
    if (!user.isEmailVerified)
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100/80 dark:bg-yellow-900/30';
    return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/30';
  };
  const handleDropdownAction = (action: string) => {
    switch (action) {
      case 'details':
        onViewDetails(user);
        break;
      case 'edit':
        onEdit(user);
        break;
      case 'role':
        onRoleChange(user);
        break;
      case 'delete':
        onDelete(user);
        break;
      case 'resendVerification':
      case 'suspend':
      case 'activate':
      case 'changeRole':
        onAction(
          user,
          action as
            | 'delete'
            | 'suspend'
            | 'activate'
            | 'changeRole'
            | 'resendVerification'
        );
        break;
      default:
        break;
    }
  };
  return (
    <div className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-gray-300/80 hover:bg-gray-50/80 hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800/40 dark:shadow-gray-900/30 dark:hover:border-gray-600/80 dark:hover:bg-gray-700/60 dark:hover:shadow-gray-900/50">
      <div className="flex flex-1 items-center gap-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-lg ring-2 ring-white/20 dark:from-blue-400 dark:via-blue-500 dark:to-purple-500 dark:shadow-blue-900/50 dark:ring-gray-900/20">
          <User className="h-6 w-6 text-white drop-shadow-sm" />
        </div>

        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-gray-700 dark:text-gray-50 dark:group-hover:text-white">
              {user.name || t('anonymousUser')}
            </h3>

            {/* Role Badge - Enhanced */}
            <Badge
              variant={getRoleVariant(user.role)}
              className="border-0 px-2.5 py-1 text-xs font-semibold capitalize shadow-sm dark:shadow-gray-900/30"
            >
              {user.role}
            </Badge>

            {/* Suspended Badge - More prominent with better dark mode */}
            {!user.isActive && (
              <Badge
                variant="destructive"
                className="animate-pulse border-0 bg-red-500/90 text-xs font-bold text-white shadow-lg ring-1 ring-red-400/50 dark:bg-red-600/90 dark:shadow-red-900/50 dark:ring-red-500/50"
              >
                {t('suspended')}
              </Badge>
            )}

            {/* Status Indicator - Enhanced for dark mode */}
            {user.isActive && (
              <div className="flex items-center gap-2 rounded-full bg-gray-100/80 px-2 py-1 dark:bg-gray-700/60">
                <div
                  className={`h-2.5 w-2.5 rounded-full shadow-sm ${getStatusColor(user)} ${!user.isEmailVerified ? 'animate-pulse' : ''}`}
                />
                <span
                  className={`text-xs font-semibold ${getStatusColor(user)}`}
                >
                  {!user.isEmailVerified ? t('unverified') : t('active')}
                </span>
              </div>
            )}
          </div>
          <div className="mb-3 text-sm font-medium text-gray-600 transition-colors group-hover:text-gray-500 dark:text-gray-300 dark:group-hover:text-gray-200">
            {user.email}
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5 rounded-md bg-gray-50/80 px-2 py-1 transition-colors group-hover:bg-gray-100/80 dark:bg-gray-700/60 dark:group-hover:bg-gray-600/60">
              <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-gray-50/80 px-2 py-1 transition-colors group-hover:bg-gray-100/80 dark:bg-gray-700/60 dark:group-hover:bg-gray-600/60">
              <HardDrive className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">
                {formatFileSize(user.storageUsed)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-gray-50/80 px-2 py-1 transition-colors group-hover:bg-gray-100/80 dark:bg-gray-700/60 dark:group-hover:bg-gray-600/60">
              <Files className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">{user.fileCount} files</span>
            </div>
          </div>
        </div>
      </div>

      <UserActionDropdown user={user} onAction={handleDropdownAction} />
    </div>
  );
}
