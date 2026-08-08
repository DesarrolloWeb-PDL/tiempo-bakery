import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  extractJtiFromCookie,
  getAdminAuthConfigError,
  getAdminPassword,
  persistAdminSession,
  revokeAdminSession,
} from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const adminPassword = getAdminPassword()

    if (!adminPassword) {
      return NextResponse.json({ error: getAdminAuthConfigError() }, { status: 503 })
    }

    const { password } = await req.json()

    if (!password || !adminPassword || password.length !== adminPassword.length || !timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword))) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    const sessionToken = await createAdminSessionToken()

    if (!sessionToken) {
      return NextResponse.json({ error: getAdminAuthConfigError() }, { status: 503 })
    }

    const jti = extractJtiFromCookie({ get: () => ({ value: sessionToken }) })
    if (jti) {
      await persistAdminSession(jti)
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ADMIN_SESSION_MAX_AGE,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const jti = extractJtiFromCookie(req.cookies)
  if (jti) {
    await revokeAdminSession(jti)
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return response
}
