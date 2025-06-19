import type { AdminUser } from '@/types/admin';

export type UserActionType = 'delete' | 'suspend' | 'role' | 'details' | 'edit' | null;

export interface UserModalProps {
  user: AdminUser;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
}

export interface UserActionModalProps extends UserModalProps {
  onConfirm: () => void;
}

export interface UserDetailsModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
}

export interface EditUserModalProps extends UserModalProps {
  onSave: (userData: Partial<AdminUser>) => void;
}

export type DeleteConfirmationModalProps = UserActionModalProps;

export interface RoleChangeConfirmationModalProps extends UserActionModalProps {
  newRole: string;
}

export interface UserRowProps {
  user: AdminUser;
  onAction: (user: AdminUser, action: 'delete' | 'suspend' | 'activate' | 'changeRole' | 'resendVerification') => void;
  onViewDetails: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onRoleChange: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

export interface UserActionDropdownProps {
  user: AdminUser;
  onAction: (action: string) => void;
}

export interface UsersTableHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredCount: number;
  totalCount: number;
  onRefresh?: () => void;
}

export interface EmptyUsersStateProps {
  searchTerm: string;
}
