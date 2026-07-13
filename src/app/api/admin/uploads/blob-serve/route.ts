import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pathname = searchParams.get('path')

    if (!pathname) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    const sanitized = decodeURIComponent(pathname).replace(/^\/+/, '')

    const result = await get(sanitized, { access: 'private' })

    if (!result) {
      return NextResponse.json({ error: 'Blob not found' }, { status: 404 })
    }

    if (result.statusCode === 304 || !result.stream) {
      return NextResponse.json({ error: 'Not modified' }, { status: 304 })
    }

    const contentType = result.blob.contentType || 'application/octet-stream'

    return new NextResponse(result.stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('[Blob Serve] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to serve blob' },
      { status: 500 }
    )
  }
}
