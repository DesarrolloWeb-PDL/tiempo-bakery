import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-static'

export async function GET() {
  const fallbackPath = path.join(process.cwd(), 'public', 'img', 'espiga.png')
  const buffer = await readFile(fallbackPath)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
