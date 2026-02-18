import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getUploadDir() {
  // En producción (Vercel/serverless), usar /tmp que es writable
  // En desarrollo, usar /public/img que es persistente
  if (process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'logo-uploads')
  }
  return path.join(process.cwd(), 'public', 'img')
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('file')
    
    if (!filename) {
      return NextResponse.json({ error: 'No file specified' }, { status: 400 })
    }

    const uploadDir = getUploadDir()
    const filepath = path.join(uploadDir, filename)
    
    // Validar que el archivo está dentro del directorio permitido
    if (!filepath.startsWith(uploadDir)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const buffer = await readFile(filepath)
    
    // Detectar tipo MIME del archivo
    let contentType = 'image/png'
    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg'
    else if (filename.endsWith('.gif')) contentType = 'image/gif'
    else if (filename.endsWith('.webp')) contentType = 'image/webp'
    else if (filename.endsWith('.svg')) contentType = 'image/svg+xml'
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('[Logo Serve] Error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
