import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export const dynamic = 'force-static'

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/img/espiga.png', req.url), 307)
}
