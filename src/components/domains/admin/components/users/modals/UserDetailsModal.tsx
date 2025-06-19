'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { formatFileSize } from '@/lib/core/utils';
import type { UserDetailsModalProps } from '../types';
import type { AdminUser } from '@/types/admin';

export default function UserDetailsModal({ 
  user, 
  isOpen, 
  onClose 
}: UserDetailsModalProps) {
  const t = useTranslations('Admin');

  if (!isOpen) return null;

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };  const getStatusColor = (user: AdminUser) => {
    if (!user.isActive) return 'text-red-600 dark:text-red-400';
    if (!user.isEmailVerified) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5" />
          {t('userDetails')}
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('name')}:</span>
            <span className="font-medium">{user.name || t('anonymousUser')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('email')}:</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('role')}:</span>
            <Badge variant={getRoleVariant(user.role)} className="capitalize">
              {user.role}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('status')}:</span>
            <span className={getStatusColor(user)}>
              {!user.isActive 
                ? t('suspended')
                : !user.isEmailVerified 
                ? t('unverified')
                : t('active')
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('storageUsed')}:</span>
            <span className="font-medium">{formatFileSize(user.storageUsed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('fileCount')}:</span>
            <span className="font-medium">{user.fileCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{t('createdAt')}:</span>
            <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
