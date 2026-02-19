import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile, readFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024

function isCloudinaryConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

async function uploadToCloudinary(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
  const apiKey = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'tiempo-bakery/productos'
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = createHash('sha1').update(toSign).digest('hex')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('folder', folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json().catch(() => ({} as Record<string, unknown>))
  if (!response.ok || typeof data.secure_url !== 'string') {
    throw new Error('No se pudo subir la imagen a Cloudinary')
  }

  return data.secure_url
}

function getUploadDir() {
  // En producción (Vercel/serverless), usar /tmp que es writable
  // En desarrollo, usar /public/uploads que es persistente
  if (process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'producto-uploads')
  }
  return path.join(process.cwd(), 'public', 'uploads', 'productos')
}

function getServeUrl(filename: string) {
  // En producción, servir desde /api endpoint que lee de /tmp
  // En desarrollo, servir directamente desde /public
  if (process.env.NODE_ENV === 'production') {
    return `/api/admin/uploads/serve?file=${filename}`
  }
  return `/uploads/productos/${filename}`
}

function getExtension(fileName: string, mimeType: string) {
  const byMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }

  const rawExt = path.extname(fileName).replace('.', '').toLowerCase()
  if (rawExt) return rawExt
  return byMime[mimeType] ?? 'jpg'
}

export async function POST(req: NextRequest) {
  try {
    console.log('Iniciando upload...')
    const formData = await req.formData()
    const file = formData.get('file')

    console.log('Archivo recibido:', { name: file instanceof File ? file.name : 'no es file', type: file instanceof File ? file.type : 'N/A' })

    if (!file || !(file instanceof File)) {
      console.error('Archivo inválido')
      return NextResponse.json({ error: 'Archivo no válido' }, { status: 400 })
    }

    if (!ALLOWED_MIME.has(file.type)) {
      console.error('MIME type no soportado:', file.type)
      return NextResponse.json({ error: 'Formato no soportado. Usa JPG, PNG o WEBP' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      console.error('Archivo muy grande:', file.size)
      return NextResponse.json({ error: 'La imagen supera 5MB' }, { status: 400 })
    }

    if (isCloudinaryConfigured()) {
      const cloudUrl = await uploadToCloudinary(file)
      return NextResponse.json({ url: cloudUrl })
    }

    const ext = getExtension(file.name, file.type)
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

    const uploadDir = getUploadDir()
    
    console.log('Directorio de upload:', uploadDir)

    await mkdir(uploadDir, { recursive: true })

    const fullPath = path.join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    
    console.log('Escribiendo archivo:', { path: fullPath, size: buffer.length })
    
    await writeFile(fullPath, buffer)

    console.log('Archivo guardado exitosamente')
    const url = getServeUrl(fileName)
    console.log('URL de acceso:', url)
    return NextResponse.json({ url })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error uploading file:', errorMsg, error)
    return NextResponse.json({ error: `Error al subir imagen: ${errorMsg}` }, { status: 500 })
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
    return NextResponse.redirect(new URL('/img/espiga.png', req.url), 307)
  }
}
