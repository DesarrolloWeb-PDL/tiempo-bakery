import { NextRequest, NextResponse } from 'next/server'

// Contraseña de admin configurable por variable de entorno
// Por defecto "admin123" para desarrollo local
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123'
const ADMIN_COOKIE = 'tbk_admin_auth'

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

  // Comprobar cookie de sesión
  const authCookie = req.cookies.get(ADMIN_COOKIE)
  if (authCookie?.value === ADMIN_PASSWORD) {
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
