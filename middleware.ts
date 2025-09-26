/**
 * Next.js Middleware for QALA
 * Handles authentication and route protection at the edge
 */

import { NextRequest } from 'next/server'
import { authMiddleware } from '@/lib/middleware'

/**
 * Main middleware function that runs on all requests
 */
export async function middleware(request: NextRequest) {
  return authMiddleware(request)
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}