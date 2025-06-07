"use client";

import { useState } from "react";
import AdminUserList from "./index";
import type { User } from "./types";
import { toast } from "sonner";

interface AdminUserListWrapperProps {
  users: User[];
}

export default function AdminUserListWrapper({
  users,
}: AdminUserListWrapperProps) {
  const [usersList, setUsersList] = useState<User[]>(users);

  const handleUserAction = async (
    userId: string,
    action: "delete" | "toggleRole" | "resendVerification"
  ) => {
    try {
      let endpoint = "";
      let method = "POST";
      let body: string | undefined = undefined;

      switch (action) {
        case "delete":
          endpoint = `/api/admin/users/${userId}/delete`;
          method = "DELETE";
          break;
        case "toggleRole":
          // Find the current user to toggle their role
          const currentUser = usersList.find((u) => u.id === userId);
          if (!currentUser) return;

          const newRole = currentUser.role === "admin" ? "user" : "admin";
          endpoint = `/api/admin/users/${userId}/role`;
          method = "PATCH";
          body = JSON.stringify({ role: newRole });
          break;
        case "resendVerification":
          endpoint = `/api/admin/users/${userId}/resend-verification`;
          method = "POST";
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);

        // Update the local state based on the action
        if (action === "delete") {
          setUsersList((prev) => prev.filter((u) => u.id !== userId));
        } else if (action === "toggleRole") {
          setUsersList((prev) =>
            prev.map((u) =>
              u.id === userId
                ? { ...u, role: u.role === "admin" ? "user" : "admin" }
                : u
            )
          );
        }
        // For resendVerification, no local state update needed
      } else {
        toast.error(result.error || "Action failed");
      }
    } catch (error) {
      console.error("User action error:", error);
      toast.error("An error occurred while performing the action");
    }
  };
  const handleBulkAction = async (
    userIds: string[],
    action: "delete" | "toggleRole" | "resendVerification"
  ) => {
    try {
      const promises = userIds.map((userId) =>
        handleUserAction(userId, action)
      );
      await Promise.all(promises);

      toast.success(
        `Successfully performed ${action} on ${userIds.length} user${
          userIds.length > 1 ? "s" : ""
        }`
      );
    } catch (error) {
      console.error("Bulk action error:", error);
      toast.error(
        "Some actions may have failed. Please check individual results."
      );
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
