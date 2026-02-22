import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getUploadDir() {
  // En producción (Vercel/serverless), usar /tmp que es writable
  // En desarrollo, usar /public/uploads que es persistente
  if (process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'producto-uploads')
  }
  return path.join(process.cwd(), 'public', 'uploads', 'productos')
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
    let contentType = 'image/jpeg'
    if (filename.endsWith('.png')) contentType = 'image/png'
    else if (filename.endsWith('.webp')) contentType = 'image/webp'
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[Upload Serve] Error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
