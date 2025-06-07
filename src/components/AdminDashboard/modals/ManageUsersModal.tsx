"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminUserListWrapper from "@/components/AdminUserList/AdminUserListWrapper";
import type { User } from "../types";

interface ManageUsersModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  loading: boolean;
}

export default function ManageUsersModal({
  isOpen,
  onOpenChange,
  users,
  loading,
}: ManageUsersModalProps) {
  // Transform AdminDashboard User type to AdminUserList User type
  const transformedUsers = users.map((user) => ({
    id: user._id,
    name: user.name || "Unknown",
    email: user.email,
    role: (user.role || "user") as "admin" | "user",
    isEmailVerified: true, // Default assumption for modal display
    isActive: true,
    createdAt: user.createdAt,
    lastActiveAt: user.createdAt, // Use createdAt as fallback
    storageUsed: 0, // Default for modal display
    fileCount: 0, // Default for modal display
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Users</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[75vh] pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading users...
              </div>
            </div>
          ) : (
            <AdminUserListWrapper users={transformedUsers} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
