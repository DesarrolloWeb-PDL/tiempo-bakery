import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, getAdminPassword, hasAdminSession, isAdminAuthConfigured } from '@/lib/admin-auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Solo proteger rutas /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Permitir la página de login
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: 'Panel de administración deshabilitado: falta ADMIN_PASSWORD' },
      { status: 503 }
    )
  }

  // Comprobar cookie de sesión
  if (hasAdminSession(req.cookies)) {
    return NextResponse.next()
  }

  // Redirigir al login
  const loginUrl = new URL('/admin/login', req.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/admin/:path*'],
}
