import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { hasAdminSession } from '@/lib/admin-auth'
import { uploadPublicAsset } from '@/lib/supabase'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

export const dynamic = 'force-dynamic'

function getUploadDir() {
  return path.join('/tmp', 'logo-uploads')
}

function getPublicOrigin(req: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_URL?.trim()
  if (configured && /^https?:\/\//i.test(configured) && !configured.includes('localhost')) {
    return configured
  }

  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host
  return `${proto}://${host}`
}

function shouldUseLocalFallback(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  if (error.message.includes('para usar Supabase Storage')) {
    return true
  }

  return process.env.NODE_ENV !== 'production'
}

function getFileExtension(file: File) {
  const byMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  }

  return file.name.split('.').pop()?.toLowerCase() || byMime[file.type] || 'png'
}

async function uploadLogoLocally(file: File, req: NextRequest) {
  const uploadDir = getUploadDir()
  const ext = getFileExtension(file)
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
  const filepath = path.join(uploadDir, filename)

  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(filepath, Buffer.from(await file.arrayBuffer()))

  const url = `/api/admin/uploads/logo?file=${encodeURIComponent(filename)}`

  return {
    filePath: filename,
    publicUrl: url,
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[Logo Upload] Request received')

    if (!(await hasAdminSession(req.cookies))) {
      console.log('[Logo Upload] Unauthorized - no admin session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      console.log('[Logo Upload] No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`[Logo Upload] File: ${file.name}, Size: ${file.size}, Type: ${file.type}`)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.log(`[Logo Upload] Invalid type: ${file.type}`)
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log(`[Logo Upload] File too large: ${file.size}`)
      return NextResponse.json(
        { error: 'File too large (max 5MB)' },
        { status: 400 }
      )
    }

    let upload
    try {
      upload = await uploadPublicAsset(file, 'branding')
    } catch (storageError) {
      if (!shouldUseLocalFallback(storageError)) {
        throw storageError
      }

      console.warn('[Logo Upload] Supabase no configurado; usando fallback local')
      upload = await uploadLogoLocally(file, req)
    }

    console.log(`[Logo Upload] Success, URL: ${upload.publicUrl}`)

    return NextResponse.json({
      url: upload.publicUrl,
      filename: upload.filePath,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('[Logo Upload] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      { status: 500 }
    )
  }
}

// GET endpoint para servir archivos de /tmp en producción
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('file')
    
    if (!filename) {
      return NextResponse.json({ error: 'No file specified' }, { status: 400 })
    }

    // En producción, leer de /tmp
    const uploadDir = getUploadDir()
    const filepath = path.join(uploadDir, filename)
    
    // Validar que el archivo está dentro del directorio permitido
    if (!filepath.startsWith(uploadDir)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const buffer = await fs.readFile(filepath)
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[Logo Serve] Error:', error)
    return NextResponse.redirect(new URL('/img/espiga.png', getPublicOrigin(req)), 307)
  }
}
