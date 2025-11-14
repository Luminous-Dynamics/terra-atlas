import { NextRequest, NextResponse } from 'next/server'

/**
 * Next.js Edge Middleware
 *
 * Runs on every request before reaching the application
 * Used for: security headers, authentication checks, redirects
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // ============================================================================
  // Security Headers
  // ============================================================================

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable browser XSS protection (legacy, but doesn't hurt)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Restrict browser features and APIs
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Content Security Policy
  // NOTE: Adjust as needed for your external dependencies
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://vercel.live wss://*.supabase.co https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Strict Transport Security (HSTS)
  // Only enable in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // ============================================================================
  // CORS Headers (for API routes)
  // ============================================================================

  // Only apply CORS headers to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://terra-atlas.earth', 'https://www.terra-atlas.earth']
      : ['http://localhost:3002', 'http://localhost:3000']

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      )
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
      )
      response.headers.set('Access-Control-Max-Age', '86400')
    }

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }
  }

  // ============================================================================
  // Custom Headers
  // ============================================================================

  // Add custom header to identify the platform
  response.headers.set('X-Powered-By', 'Terra Atlas')

  // Add request ID for tracking (useful for debugging)
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)

  return response
}

/**
 * Middleware Configuration
 *
 * Specify which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)',
  ],
}
