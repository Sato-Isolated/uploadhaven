import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Create the i18n middleware
const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle direct access to uploaded files - bypass i18n for these
  if (pathname.startsWith('/uploads/')) {
    // Allow direct access to public files (without password protection)
    if (pathname.startsWith('/uploads/public/')) {
      return NextResponse.next();
    }

    // Block direct access to protected files (with password protection)
    if (pathname.startsWith('/uploads/protected/')) {
      return NextResponse.json(
        {
          error:
            'This file is password protected. Please use the provided download links.',
        },
        { status: 403 }
      );
    }

    // Block access to any other files in uploads (fallback security)
    return NextResponse.json(
      {
        error:
          'Direct file access not allowed. Please use the provided download links.',
      },
      { status: 403 }
    );
  }

  // Skip i18n middleware for API routes, internal Next.js paths, and files with extensions
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.includes('.')
  ) {
    // For protected API routes, still check authentication
    const protectedApiRoutes = ['/api/admin', '/api/dashboard'];
    const isProtectedApiRoute = protectedApiRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isProtectedApiRoute) {
      const sessionCookie =
        request.cookies.get('better-auth.session_token') ||
        request.cookies.get('uploadhaven.session_token') ||
        request.cookies.get('session-token');

      if (!sessionCookie || !sessionCookie.value) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    return NextResponse.next();
  }

  // Check if the route needs authentication
  const protectedRoutes = ['/dashboard', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) => {
    // Remove locale prefix when checking routes
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
    return pathWithoutLocale.startsWith(route);
  });

  if (isProtectedRoute) {
    // Check for Better Auth session cookie
    const sessionCookie =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('uploadhaven.session_token') ||
      request.cookies.get('session-token');

    if (!sessionCookie || !sessionCookie.value) {
      // Redirect to sign-in page with locale
      const locale = pathname.split('/')[1];
      const isValidLocale = routing.locales.includes(
        locale as (typeof routing.locales)[number]
      );
      const redirectLocale = isValidLocale ? locale : routing.defaultLocale;
      return NextResponse.redirect(
        new URL(`/${redirectLocale}/auth/signin`, request.url)
      );
    }
  }

  // Check for admin routes
  if (pathname.includes('/admin')) {
    const sessionCookie =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('uploadhaven.session_token') ||
      request.cookies.get('session-token');

    if (!sessionCookie || !sessionCookie.value) {
      const locale = pathname.split('/')[1];
      const isValidLocale = routing.locales.includes(
        locale as (typeof routing.locales)[number]
      );
      const redirectLocale = isValidLocale ? locale : routing.defaultLocale;
      return NextResponse.redirect(
        new URL(`/${redirectLocale}/auth/signin`, request.url)
      );
    }
  }

  // Apply i18n middleware for all other routes
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    // - … uploads directory (handled separately)
    '/((?!api|_next|_vercel|uploads|.*\\..*).*)',
  ],
};
