import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protéger les routes admin
  if (pathname.startsWith('/admin')) {
    try {
      // Vérifier la session
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        // Rediriger vers login si pas connecté
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Vérifier le rôle admin
      if (session.user.role !== 'admin') {
        // Rediriger vers page d'accès refusé si pas admin
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
    } catch (error) {
      // En cas d'erreur, rediriger vers login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
