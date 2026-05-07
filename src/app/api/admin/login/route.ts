import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  getAdminAuthConfigError,
  getAdminPassword,
} from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const adminPassword = getAdminPassword()

    if (!adminPassword) {
      return NextResponse.json({ error: getAdminAuthConfigError() }, { status: 503 })
    }

    const { password } = await req.json()

    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    const sessionToken = await createAdminSessionToken()

    if (!sessionToken) {
      return NextResponse.json({ error: getAdminAuthConfigError() }, { status: 503 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ADMIN_SESSION_MAX_AGE,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
