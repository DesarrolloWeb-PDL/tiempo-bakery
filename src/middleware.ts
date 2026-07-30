import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthConfigError, hasAdminSessionEdge, isAdminAuthConfigured } from '@/lib/admin-auth'
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
  '/api/admin/uploads/blob-serve',
])

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getAllowedOrigin(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`
}

function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const allowed = getAllowedOrigin(req)

  if (origin) {
    return origin === allowed || origin === 'http://localhost:3000'
  }

  if (referer) {
    return referer.startsWith(allowed) || referer.startsWith('http://localhost:3000')
  }

  return false
}

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

function buildRateLimitedResponse(req: NextRequest, limit: { retryAfterSeconds: number; limit: number; remaining: number; resetAt: number }) {
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
    const rateLimit = await consumeRateLimit({
      key: `${req.method}:${pathname}:${ip}`,
      limit: sensitiveLimit.limit,
      windowMs: sensitiveLimit.windowMs,
    })

    if (!rateLimit.allowed) {
      return buildRateLimitedResponse(req, rateLimit)
    }
  }

  if (isAdminApi && MUTATION_METHODS.has(req.method)) {
    const allowedOrigin = getAllowedOrigin(req)
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')

    if (!origin && !referer) {
      return NextResponse.json({ error: 'CSRF: faltan headers de origen' }, { status: 403 })
    }

    if (origin && origin !== allowedOrigin && origin !== 'http://localhost:3000') {
      return NextResponse.json({ error: 'CSRF: origen no permitido' }, { status: 403 })
    }

    if (!origin && referer && !referer.startsWith(allowedOrigin) && !referer.startsWith('http://localhost:3000')) {
      return NextResponse.json({ error: 'CSRF: referer no permitido' }, { status: 403 })
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

  if (await hasAdminSessionEdge(req.cookies)) {
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
