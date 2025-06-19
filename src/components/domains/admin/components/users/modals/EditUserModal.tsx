'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit } from 'lucide-react';
import { toast } from 'sonner';
import type { EditUserModalProps } from '../types';

export default function EditUserModal({ 
  user, 
  isOpen, 
  isLoading,
  onClose,
  onSave 
}: EditUserModalProps) {
  const t = useTranslations('Admin');
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    role: user.role
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isFormValid = formData.email.trim() !== '' && formData.email.includes('@');
  const hasChanges = formData.name !== (user.name || '') || 
                     formData.email !== user.email || 
                     formData.role !== user.role;  const handleSave = async () => {
    if (!isFormValid || !hasChanges) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(t('userEditedSuccess'));
        onSave(formData);
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(t('userEditError') || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Edit className="h-5 w-5" />
          {t('editUser')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('name')}
            </label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('anonymousUser')}
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('email')}
            </label>
            <Input 
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              type="email"
              className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('role')}
            </label>            <select 
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' | 'moderator' }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="user">{t('user')}</option>
              <option value="admin">{t('admin')}</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading || isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || isSubmitting || !isFormValid || !hasChanges}
          >
            {isSubmitting ? t('processing') : t('saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}
