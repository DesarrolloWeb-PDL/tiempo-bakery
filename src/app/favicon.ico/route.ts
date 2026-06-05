import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-static'

function getPublicOrigin(req: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_URL?.trim()
  if (configured && /^https?:\/\//i.test(configured) && !configured.includes('localhost')) {
    return configured
  }

  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host
  return `${proto}://${host}`
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/img/espiga.png', getPublicOrigin(req)), 307)
}
