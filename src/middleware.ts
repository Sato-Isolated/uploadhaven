import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle direct access to uploaded files
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

  // Check if the route needs authentication
  const protectedRoutes = ['/dashboard', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isProtectedRoute) {
    // Check for Better Auth session cookie
    // Better Auth typically uses these cookie names
    const sessionCookie =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('uploadhaven.session_token') ||
      request.cookies.get('session-token');

    if (!sessionCookie || !sessionCookie.value) {
      // Redirect to sign-in page
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  // Check for admin routes
  if (pathname.startsWith('/admin')) {
    // For now, just check if user is authenticated
    // Later we'll add proper role checking
    const sessionCookie =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('uploadhaven.session_token') ||
      request.cookies.get('session-token');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/uploads/:path*', // Allow checking uploaded files but don't block them
  ],
};
