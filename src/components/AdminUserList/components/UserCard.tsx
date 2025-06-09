import React from "react";
import { motion } from "motion/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Mail, MailCheck, Trash2, UserCog } from "lucide-react";
import type { User } from "../types";

interface UserCardProps {
  user: User;
  isSelected?: boolean;
  onUserAction: (
    userId: string,
    action: "delete" | "toggleRole" | "resendVerification"
  ) => void;
  onSelectionChange?: (userId: string, selected: boolean) => void;
}

export default function UserCard({
  user,
  isSelected = false,
  onUserAction,
  onSelectionChange,
}: UserCardProps) {
  // Guard against undefined user or user.id
  if (!user || !user.id) {
    // UserCard received invalid user data
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`hover:shadow-lg transition-shadow duration-200 ${
          isSelected
            ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : ""
        }`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              {onSelectionChange && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    onSelectionChange(user.id, checked as boolean)
                  }
                  className="mt-1"
                />
              )}
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {user.name || "Unknown User"}
                  </h3>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="flex items-center space-x-1"
                  >
                    <Shield className="h-3 w-3" />
                    <span className="capitalize">{user.role || "user"}</span>
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <p className="text-gray-600 dark:text-gray-400 truncate">
                    {user.email || "No email"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    ID: {user.id.slice(-8)}
                  </p>
                </div>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge
                    variant={user.isEmailVerified ? "default" : "secondary"}
                    className="flex items-center space-x-1"
                  >
                    {user.isEmailVerified ? (
                      <MailCheck className="h-3 w-3" />
                    ) : (
                      <Mail className="h-3 w-3" />
                    )}
                    <span>
                      {user.isEmailVerified ? "Verified" : "Unverified"}
                    </span>
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Joined:</span>
                    <span className="ml-1">
                      {user.createdAt ? formatDate(user.createdAt) : "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Last Active:</span>
                    <span className="ml-1">
                      {user.lastActiveAt
                        ? formatDate(user.lastActiveAt)
                        : "Never"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Storage Used:</span>
                    <span className="ml-1">
                      {formatBytes(user.storageUsed || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Files:</span>
                    <span className="ml-1">{user.fileCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUserAction(user.id, "toggleRole")}
                className="flex items-center space-x-1"
              >
                <UserCog className="h-4 w-4" />
                <span>
                  {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                </span>
              </Button>

              {!user.isEmailVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUserAction(user.id, "resendVerification")}
                  className="flex items-center space-x-1"
                >
                  <Mail className="h-4 w-4" />
                  <span>Resend Email</span>
                </Button>
              )}

              <Button
                variant="destructive"
                size="sm"
                onClick={() => onUserAction(user.id, "delete")}
                className="flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
