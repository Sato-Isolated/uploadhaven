'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import type { RoleChangeConfirmationModalProps } from '../types';

export default function RoleChangeConfirmationModal({ 
  user, 
  isOpen, 
  isLoading,
  newRole,
  onClose,
  onConfirm 
}: RoleChangeConfirmationModalProps) {
  const t = useTranslations('Admin');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('changeRoleConfirmTitle')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('changeRoleConfirmDescription', { 
            email: user.email || '',
            newRole: newRole
          })}
        </p>
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? t('processing') : t('confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
