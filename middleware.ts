import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // Get the pathname from the request
  const pathname = request.nextUrl.pathname;
  
  // Handle telegram-verified redirect for old links without locale
  if (pathname === '/auth/telegram-verified') {
    const url = request.nextUrl.clone();
    url.pathname = '/ru/auth/telegram-verified';
    return NextResponse.redirect(url);
  }
  
  // Handle internationalization first
  const response = intlMiddleware(request);
  
  // Get the pathname again after intl processing
  const finalPathname = response.headers.get('x-middleware-rewrite') 
    ? new URL(response.headers.get('x-middleware-rewrite')!).pathname 
    : pathname;
  
  // Skip auth check for auth-related routes, API routes, and static assets
  const isAuthRoute = pathname.includes('/auth/') || pathname.includes('/api/auth/');
  const isApiRoute = pathname.startsWith('/api/');
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.includes('.');
  
  if (isAuthRoute || isApiRoute || isStaticAsset) {
    return response;
  }
  
  // Check if user is accessing protected routes
  const isProtectedRoute = finalPathname.includes('/profile') || finalPathname.includes('/dashboard');
  
  // Note: Removed auth check from middleware due to Edge Runtime limitations
  // Auth protection is handled in individual pages using NextAuth
  
  return response;
}

export const config = {
  // Match internationalized pathnames and protected routes
  matcher: ['/', '/(ru|en)/:path*']
};
