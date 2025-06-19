'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { DeleteConfirmationModalProps } from '../types';

export default function DeleteConfirmationModal({ 
  user, 
  isOpen, 
  isLoading,
  onClose,
  onConfirm 
}: DeleteConfirmationModalProps) {
  const t = useTranslations('Admin');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
          <Trash2 className="h-5 w-5" />
          {t('deleteUserConfirmTitle')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('deleteUserConfirmDescription', { email: user.email || '' })}
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
            variant="destructive"
          >
            {isLoading ? t('processing') : t('confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
