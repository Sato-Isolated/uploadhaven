'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { toast } from 'sonner';
import type { AdminUser } from '@/types/admin';
import {
  UserDetailsModal,
  EditUserModal,
  DeleteConfirmationModal,
  RoleChangeConfirmationModal,
  UsersTableHeader,
  UserRow,
  EmptyUsersState,
  type UserActionType
} from './users';

interface UsersTableProps {
  users: AdminUser[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export default function UsersTable({ users, isLoading, onRefresh }: UsersTableProps) {
  const t = useTranslations('Admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<UserActionType>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserAction = async (user: AdminUser, action: 'delete' | 'suspend' | 'activate' | 'changeRole' | 'resendVerification') => {
    setIsActionLoading(true);
    
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (action) {
        case 'delete':
          endpoint = `/api/admin/users/${user.id}`;
          method = 'DELETE';
          break;
        case 'suspend':
          endpoint = `/api/admin/users/${user.id}?action=deactivate`;
          method = 'POST';
          break;
        case 'activate':
          endpoint = `/api/admin/users/${user.id}?action=activate`;
          method = 'POST';
          break;
        case 'changeRole':
          endpoint = `/api/admin/users/${user.id}`;
          method = 'PATCH';
          break;
        case 'resendVerification':
          endpoint = `/api/admin/users/${user.id}/resend-verification`;
          method = 'POST';
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: action === 'changeRole' ? JSON.stringify({ 
          role: user.role === 'admin' ? 'user' : 'admin' 
        }) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }      toast.success(t(`userAction${action.charAt(0).toUpperCase() + action.slice(1)}Success`));
      
      // Force immediate refresh for UI feedback
      if (onRefresh) {
        onRefresh();
        // Also force a small delay to ensure backend has updated
        setTimeout(() => {
          onRefresh();
        }, 500);
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      toast.error(t(`userAction${action.charAt(0).toUpperCase() + action.slice(1)}Error`));
    } finally {
      setIsActionLoading(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  const handleViewDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('details');
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('edit');
  };

  const handleRoleChange = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('role');
  };

  const handleDelete = (user: AdminUser) => {
    setSelectedUser(user);
    setActionType('delete');
  };

  const closeModal = () => {
    setSelectedUser(null);
    setActionType(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('usersManagement')}
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <UsersTableHeader
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filteredCount={filteredUsers.length}
              totalCount={users.length}
              onRefresh={onRefresh}
            />
          </CardHeader>

          <CardContent>
            {filteredUsers.length === 0 ? (
              <EmptyUsersState searchTerm={searchTerm} />
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onAction={handleUserAction}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onRoleChange={handleRoleChange}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modals */}
      {selectedUser && (
        <>
          <UserDetailsModal
            user={selectedUser}
            isOpen={actionType === 'details'}
            onClose={closeModal}
          />
            <EditUserModal
            user={selectedUser}
            isOpen={actionType === 'edit'}
            isLoading={isActionLoading}
            onClose={closeModal}            onSave={() => {
              // Trigger data refresh after successful edit
              onRefresh?.();
            }}
          />
          
          <DeleteConfirmationModal
            user={selectedUser}
            isOpen={actionType === 'delete'}
            isLoading={isActionLoading}
            onClose={closeModal}
            onConfirm={() => handleUserAction(selectedUser, 'delete')}
          />
          
          <RoleChangeConfirmationModal
            user={selectedUser}
            isOpen={actionType === 'role'}
            isLoading={isActionLoading}
            newRole={selectedUser.role === 'admin' ? t('user') : t('admin')}
            onClose={closeModal}
            onConfirm={() => handleUserAction(selectedUser, 'changeRole')}
          />
        </>
      )}
    </>
  );
}
