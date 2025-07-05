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
 * Vérifier si l'utilisateur actuel est un admin
 * @returns Promise<boolean> - true si admin, false sinon
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    return session?.user?.role === 'admin';
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions admin:', error);
    return false;
  }
}

/**
 * Obtenir la session utilisateur actuelle
 * @returns Promise<UserSession | null>
 */
export async function getCurrentUserSession(): Promise<UserSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    return session;
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    return null;
  }
}

/**
 * Vérifier si l'utilisateur est connecté
 * @returns Promise<boolean>
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    return !!session;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
}

/**
 * Vérifier si l'utilisateur a un rôle spécifique
 * @param requiredRole - Le rôle requis
 * @returns Promise<boolean>
 */
export async function hasRole(requiredRole: 'user' | 'admin'): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    return session?.user?.role === requiredRole;
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle:', error);
    return false;
  }
}
