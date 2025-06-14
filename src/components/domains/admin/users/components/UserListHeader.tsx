import React from 'react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { User } from '../types';

interface UserListHeaderProps {
  users: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedCount?: number;
  allSelected?: boolean;
  onSelectAll?: (selected: boolean) => void;
}

export default function UserListHeader({
  users,
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  selectedCount = 0,
  allSelected = false,
  onSelectAll,
}: UserListHeaderProps) {
  const t = useTranslations('Search');

  return (
    <motion.div
      className="mb-6 space-y-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-4">
          {onSelectAll && users.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Select All ({selectedCount}/{users.length})
              </span>
            </div>
          )}
          <Badge variant="secondary" className="text-sm">
            {users.length} {users.length === 1 ? 'User' : 'Users'}
          </Badge>
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('searchUsersByNameOrEmail')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="w-32">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allRoles')}</SelectItem>
              <SelectItem value="admin">{t('admin')}</SelectItem>
              <SelectItem value="user">{t('user')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="verified">{t('verified')}</SelectItem>
              <SelectItem value="unverified">{t('unverified')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}
