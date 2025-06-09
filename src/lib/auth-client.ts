import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000"),
});

// Export better-auth functions directly
export const { useSession, signIn, signUp, signOut } = authClient;
