// Types for AdminUserList components

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isEmailVerified: boolean;
  isActive?: boolean;
  createdAt: string;
  lastActiveAt: string;
  storageUsed: number;
  fileCount: number;
}

export interface AdminUserListProps {
  users: User[];
  onUserAction: (
    userId: string,
    action: "delete" | "toggleRole" | "resendVerification"
  ) => void;
  onBulkAction?: (
    userIds: string[],
    action: "delete" | "toggleRole" | "resendVerification"
  ) => void;
}
