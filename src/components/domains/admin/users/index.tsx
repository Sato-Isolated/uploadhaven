import React, { useState, useMemo } from "react";
import UserListHeader from "./components/UserListHeader";
import UserCard from "./components/UserCard";
import BulkActionsBar from "./components/BulkActionsBar";
import type { AdminUserListProps, User } from "./types";

export default function AdminUserList({
  users,
  onUserAction,
  onBulkAction,
}: AdminUserListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Filter out any invalid user objects
  const validUsers = users.filter((user): user is User => {
    if (!user || !user.id || !user.email || !user.name) {
      // Invalid user object filtered out
      return false;
    }
    return true;
  });

  const filteredUsers = useMemo(() => {
    return validUsers.filter((user: User) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "verified") {
        matchesStatus = user.isEmailVerified === true;
      } else if (statusFilter === "unverified") {
        matchesStatus = user.isEmailVerified === false;
      } else if (statusFilter === "active") {
        matchesStatus = user.isActive !== false;
      } else if (statusFilter === "inactive") {
        matchesStatus = user.isActive === false;
      }      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [validUsers, searchQuery, roleFilter, statusFilter]);

  const handleSelectionChange = (userId: string, selected: boolean) => {
    const newSelection = new Set(selectedUsers);
    if (selected) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(new Set(filteredUsers.map((user) => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleBulkAction = (
    action: "delete" | "toggleRole" | "resendVerification"
  ) => {
    if (onBulkAction && selectedUsers.size > 0) {
      onBulkAction(Array.from(selectedUsers), action);
      setSelectedUsers(new Set()); // Clear selection after action
    }
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };
  return (
    <div className="space-y-6">
      <UserListHeader
        users={filteredUsers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedCount={selectedUsers.size}
        allSelected={
          filteredUsers.length > 0 &&
          selectedUsers.size === filteredUsers.length
        }
        onSelectAll={handleSelectAll}
      />

      <div className="space-y-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUsers.has(user.id)}
              onUserAction={onUserAction}
              onSelectionChange={handleSelectionChange}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "No users match your current filters."
                : "No users found."}
            </p>
          </div>
        )}
      </div>

      <BulkActionsBar
        selectedCount={selectedUsers.size}
        onClearSelection={clearSelection}
        onBulkAction={handleBulkAction}
      />
    </div>
  );
}

// Also export the types for convenience
export type { User, AdminUserListProps } from "./types";
