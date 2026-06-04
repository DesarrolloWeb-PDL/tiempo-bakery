import { NextRequest, NextResponse } from 'next/server'

const BASE_SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=() ',
  'Cross-Origin-Opener-Policy': 'same-origin',
} as const

function isHttpsRequest(req: NextRequest) {
  return req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https'
}

export function applySecurityHeaders(response: NextResponse, req: NextRequest) {
  for (const [header, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    response.headers.set(header, value)
  }

  if (isHttpsRequest(req)) {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  return response
}