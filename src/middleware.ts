import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block ALL direct access to uploaded files in /uploads/*
  // Users should only access files through API routes which check permissions
  if (pathname.startsWith("/uploads/")) {
    return NextResponse.json(
      {
        error:
          "Direct file access not allowed. Please use the provided download links.",
      },
      { status: 403 }
    );
  }

  // Check if the route needs authentication
  const protectedRoutes = ["/dashboard", "/admin"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isProtectedRoute) {
    // Check for Better Auth session cookie
    // Better Auth typically uses these cookie names
    const sessionCookie =
      request.cookies.get("better-auth.session_token") ||
      request.cookies.get("uploadhaven.session_token") ||
      request.cookies.get("session-token");

    if (!sessionCookie || !sessionCookie.value) {
      // Redirect to sign-in page
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }
  // Check for admin routes
  if (pathname.startsWith("/admin")) {
    // For now, just check if user is authenticated
    // Later we'll add proper role checking
    const sessionCookie =
      request.cookies.get("better-auth.session_token") ||
      request.cookies.get("uploadhaven.session_token") ||
      request.cookies.get("session-token");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/uploads/:path*", // Add protection for uploaded files
  ],
};
