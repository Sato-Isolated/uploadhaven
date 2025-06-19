'use client';

import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Trash2,
  Shield,
  Eye,
  Edit,
} from 'lucide-react';
import type { UserActionDropdownProps } from './types';

export default function UserActionDropdown({ 
  user, 
  onAction 
}: UserActionDropdownProps) {
  const t = useTranslations('Admin');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-600/60 transition-all duration-200 rounded-lg border border-transparent hover:border-gray-200/60 dark:hover:border-gray-600/60"
        >
          <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/60 dark:border-gray-700/60 shadow-xl dark:shadow-gray-900/50"
      >
        <DropdownMenuItem 
          onClick={() => onAction('details')}
          className="cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/60 text-gray-900 dark:text-gray-100 focus:bg-gray-50/80 dark:focus:bg-gray-700/60 transition-colors"
        >
          <Eye className="mr-3 h-4 w-4 text-blue-600 dark:text-blue-400" />
          {t('viewDetails')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onAction('edit')}
          className="cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/60 text-gray-900 dark:text-gray-100 focus:bg-gray-50/80 dark:focus:bg-gray-700/60 transition-colors"
        >
          <Edit className="mr-3 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          {t('editUser')}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-200/80 dark:bg-gray-600/60" />
        
        {!user.isEmailVerified && (
          <DropdownMenuItem
            onClick={() => onAction('resendVerification')}
            className="cursor-pointer hover:bg-amber-50/80 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 focus:bg-amber-50/80 dark:focus:bg-amber-900/20 transition-colors"
          >
            <Mail className="mr-3 h-4 w-4" />
            {t('resendVerification')}
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem
          onClick={() => onAction('role')}
          className="cursor-pointer hover:bg-indigo-50/80 dark:hover:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 focus:bg-indigo-50/80 dark:focus:bg-indigo-900/20 transition-colors"
        >
          <Shield className="mr-3 h-4 w-4" />
          {user.role === 'admin' ? t('removeAdmin') : t('makeAdmin')}
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => onAction(user.isActive ? 'suspend' : 'activate')}
          className={`cursor-pointer transition-colors ${
            user.isActive 
              ? 'hover:bg-yellow-50/80 dark:hover:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 focus:bg-yellow-50/80 dark:focus:bg-yellow-900/20' 
              : 'hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 focus:bg-emerald-50/80 dark:focus:bg-emerald-900/20'
          }`}
        >
          {user.isActive ? (
            <>
              <UserX className="mr-3 h-4 w-4" />
              {t('suspendUser')}
            </>
          ) : (
            <>
              <UserCheck className="mr-3 h-4 w-4" />
              {t('activateUser')}
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-gray-200/80 dark:bg-gray-600/60" />
        <DropdownMenuItem
          onClick={() => onAction('delete')}
          className="text-red-600 dark:text-red-400 cursor-pointer hover:bg-red-50/80 dark:hover:bg-red-900/20 focus:bg-red-50/80 dark:focus:bg-red-900/20 transition-colors"
        >
          <Trash2 className="mr-3 h-4 w-4" />
          {t('deleteUser')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
