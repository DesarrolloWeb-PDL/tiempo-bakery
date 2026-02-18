import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123'
const ADMIN_COOKIE = 'tbk_admin_auth'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

export const dynamic = 'force-dynamic'

function getUploadDir() {
  // En producción (Vercel/serverless), usar /tmp que es writable
  // En desarrollo, usar /public/img para acceso directo
  if (process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'logo-uploads')
  }
  return path.join(process.cwd(), 'public', 'img')
}

function getServeUrl(filename: string) {
  // En desarrollo, servir desde /public
  // En producción, servir desde /api endpoint que lee de /tmp
  if (process.env.NODE_ENV === 'production') {
    return `/api/admin/uploads/logo-serve?file=${filename}`
  }
  return `/img/${filename}`
}

export async function POST(req: NextRequest) {
  try {
    console.log('[Logo Upload] Request received')

    // Check auth - verificar cookie correcta
    const cookieHeader = req.headers.get('cookie')
    const hasAdminAuth = cookieHeader?.includes(`${ADMIN_COOKIE}=`)
    
    if (!hasAdminAuth) {
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

    // Create upload directory if it doesn't exist
    const uploadDir = getUploadDir()
    try {
      await fs.mkdir(uploadDir, { recursive: true })
      console.log(`[Logo Upload] Directory ready: ${uploadDir}`)
    } catch (err) {
      console.log('[Logo Upload] Error creating directory:', err)
      throw new Error('Cannot create upload directory')
    }

    // Generate unique filename
    const ext = path.extname(file.name)
    const randomName = crypto.randomBytes(8).toString('hex')
    const filename = `logo-${randomName}${ext}`
    const filepath = path.join(uploadDir, filename)

    console.log(`[Logo Upload] Saving to: ${filepath}`)

    // Convert file to buffer and write
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filepath, buffer)
    console.log(`[Logo Upload] File written successfully`)

    // Return accessible URL
    const url = getServeUrl(filename)
    console.log(`[Logo Upload] Success, URL: ${url}`)

    return NextResponse.json({
      url,
      filename,
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
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
