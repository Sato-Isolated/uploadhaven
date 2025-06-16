'use client';

import { useState } from 'react';
import AdminUserList from './index';
import type { User } from './types';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface LocalUser extends User {
  deleted?: boolean;
}

interface AdminUserListWrapperProps {
  users: User[];
}

export default function AdminUserListWrapper({
  users,
}: AdminUserListWrapperProps) {
  const t = useTranslations('Admin');
  // Use derived state instead of syncing with useEffect
  const [localUsers, setLocalUsers] = useState<LocalUser[]>([]);

  // Merge prop users with local changes, prioritizing local state
  const usersList = users
    .filter(
      (propUser) =>
        !localUsers.some((local) => local.id === propUser.id && local.deleted)
    )
    .map((propUser) => {
      const localUser = localUsers.find((u) => u.id === propUser.id);
      return localUser || propUser;
    });
  const handleUserAction = async (
    userId: string,
    action: 'delete' | 'toggleRole' | 'resendVerification'
  ) => {
    try {
      let endpoint = '';
      let method = 'POST';
      let body: string | undefined = undefined;
      let newRole: 'admin' | 'user' | undefined = undefined;

      switch (action) {
        case 'delete':
          endpoint = `/api/admin/users/${userId}/delete`;
          method = 'DELETE';
          break;
        case 'toggleRole':
          // Find the current user to toggle their role
          const currentUser = usersList.find((u) => u.id === userId);
          if (!currentUser) return;

          newRole = currentUser.role === 'admin' ? 'user' : 'admin';
          endpoint = `/api/admin/users/${userId}/role`;
          method = 'PATCH';
          body = JSON.stringify({ role: newRole });
          break;
        case 'resendVerification':
          endpoint = `/api/admin/users/${userId}/resend-verification`;
          method = 'POST';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);

        // Update the local state based on the action
        if (action === 'delete') {
          setLocalUsers((prev) => [
            ...prev,
            { ...users.find((u) => u.id === userId)!, deleted: true },
          ]);
        } else if (action === 'toggleRole' && newRole) {
          // Use the newRole we calculated earlier to ensure consistency
          setLocalUsers((prev) => {
            const existingUser = prev.find((u) => u.id === userId);
            const baseUser =
              existingUser || users.find((u) => u.id === userId)!;
            const updatedUser = {
              ...baseUser,
              role: newRole as 'admin' | 'user',
            };
            return prev.some((u) => u.id === userId)
              ? prev.map((u) => (u.id === userId ? updatedUser : u))
              : [...prev, updatedUser];
          });
        }
        // For resendVerification, no local state update needed
      } else {
        toast.error(result.error || t('actionFailed'));
      }
    } catch {
      // User action error
      toast.error(t('errorPerformingAction'));
    }
  };
  const handleBulkAction = async (
    userIds: string[],
    action: 'delete' | 'toggleRole' | 'resendVerification'
  ) => {
    try {
      const promises = userIds.map((userId) =>
        handleUserAction(userId, action)
      );
      await Promise.all(promises);
      toast.success(t('bulkActionSuccess', { action, count: userIds.length }));
    } catch {
      // Bulk action error
      toast.error(t('bulkActionPartialFailure'));
    }
  };

  return (
    <AdminUserList
      users={usersList}
      onUserAction={handleUserAction}
      onBulkAction={handleBulkAction}
    />
  );
}
