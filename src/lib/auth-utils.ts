import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    image?: string | null;
  };
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

/**
 * Check if the current user is an admin
 * @returns Promise<boolean> - true if admin, false otherwise
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    return session?.user?.role === 'admin';
  } catch (error) {
    console.error('Error verifying admin permissions:', error);
    return false;
  }
}

/**
 * Get the current user session
 * @returns Promise<UserSession | null>
 */
export async function getCurrentUserSession(): Promise<UserSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    return session;
  } catch (error) {
    console.error('Error retrieving session:', error);
    return null;
  }
}

/**
 * Check if the user is authenticated
 * @returns Promise<boolean>
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    return !!session;
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return false;
  }
}

/**
 * Check if the user has a specific role
 * @param requiredRole - The required role
 * @returns Promise<boolean>
 */
export async function hasRole(requiredRole: 'user' | 'admin'): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    return session?.user?.role === requiredRole;
  } catch (error) {
    console.error('Error verifying role:', error);
    return false;
  }
}
