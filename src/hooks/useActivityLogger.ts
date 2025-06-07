import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";

// Hook to handle activity logging after successful authentication
export function useActivityLogger() {
  const { data: session, isPending } = useSession();
  useEffect(() => {
    // Only log activity if session exists and we're not loading
    if (!isPending && session?.user) {
      logUserActivity();
    }
  }, [session, isPending]);

  return { session, isPending };
}

async function logUserActivity() {
  try {
    // Update user's lastActivity via API
    await fetch("/api/user/stats", {
      method: "GET", // This endpoint already updates lastActivity
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Log security event for login
    await fetch("/api/security", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "user_login",
        details: `User logged in`,
        severity: "low",
      }),
    });
  } catch (error) {
    console.error("Failed to log user activity:", error);
    // Don't throw error to avoid breaking the login flow
  }
}
