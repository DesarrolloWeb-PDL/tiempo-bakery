import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthConfigError, hasAdminSession, isAdminAuthConfigured } from '@/lib/admin-auth'
import { consumeRateLimit } from '@/lib/rate-limit'
import { applySecurityHeaders } from '@/lib/security-headers'

type SensitiveRateLimit = {
  path: string
  method: string
  limit: number
  windowMs: number
}

const SENSITIVE_RATE_LIMITS: SensitiveRateLimit[] = [
  { path: '/api/admin/login', method: 'POST', limit: 5, windowMs: 15 * 60 * 1000 },
  { path: '/api/checkout', method: 'POST', limit: 10, windowMs: 5 * 60 * 1000 },
]

const PUBLIC_ADMIN_API_PATHS = new Set([
  '/api/admin/uploads/logo',
  '/api/admin/uploads/logo-serve',
  '/api/admin/uploads/serve',
])

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

function matchSensitiveRateLimit(req: NextRequest) {
  return SENSITIVE_RATE_LIMITS.find((rule) => req.nextUrl.pathname === rule.path && req.method === rule.method)
}

function finalizeResponse(req: NextRequest, response: NextResponse) {
  return applySecurityHeaders(response, req)
}

function buildRateLimitedResponse(req: NextRequest, limit: ReturnType<typeof consumeRateLimit>) {
  const response = NextResponse.json(
    { error: 'Demasiadas solicitudes. Probá nuevamente en unos minutos.' },
    { status: 429 }
  )

  response.headers.set('Retry-After', String(limit.retryAfterSeconds))
  response.headers.set('X-RateLimit-Limit', String(limit.limit))
  response.headers.set('X-RateLimit-Remaining', String(limit.remaining))
  response.headers.set('X-RateLimit-Reset', String(limit.resetAt))

  return finalizeResponse(req, response)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')
  const sensitiveLimit = matchSensitiveRateLimit(req)

  if (sensitiveLimit) {
    const ip = getClientIp(req)
    const rateLimit = consumeRateLimit({
      key: `${req.method}:${pathname}:${ip}`,
      limit: sensitiveLimit.limit,
      windowMs: sensitiveLimit.windowMs,
    })

    if (!rateLimit.allowed) {
      return buildRateLimitedResponse(req, rateLimit)
    }
  }

  if (!isAdminPage && !isAdminApi) {
    return finalizeResponse(req, NextResponse.next())
  }

  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return finalizeResponse(req, NextResponse.next())
  }

  if (PUBLIC_ADMIN_API_PATHS.has(pathname)) {
    return finalizeResponse(req, NextResponse.next())
  }

  if (!isAdminAuthConfigured()) {
    const payload = { error: `Panel de administración deshabilitado: ${getAdminAuthConfigError()}` }

    if (isAdminApi) {
      return finalizeResponse(req, NextResponse.json(payload, { status: 503 }))
    }

    return finalizeResponse(req, NextResponse.json(payload, { status: 503 }))
  }

  if (await hasAdminSession(req.cookies)) {
    return finalizeResponse(req, NextResponse.next())
  }

  if (isAdminApi) {
    return finalizeResponse(req, NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

  const loginUrl = new URL('/admin/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return finalizeResponse(req, NextResponse.redirect(loginUrl))
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
