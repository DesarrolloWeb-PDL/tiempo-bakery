import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthConfigError, hasAdminSession, isAdminAuthConfigured } from '@/lib/admin-auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next()
  }

  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  if (!isAdminAuthConfigured()) {
    const payload = { error: `Panel de administración deshabilitado: ${getAdminAuthConfigError()}` }

    if (isAdminApi) {
      return NextResponse.json(payload, { status: 503 })
    }

    return NextResponse.json(
      payload,
      { status: 503 }
    )
  }

  if (await hasAdminSession(req.cookies)) {
    return NextResponse.next()
  }

  if (isAdminApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/admin/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
