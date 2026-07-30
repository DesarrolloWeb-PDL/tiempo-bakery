import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { hasAdminSession } from '@/lib/admin-auth'
import { uploadPublicAsset } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024

function getLocalUploadDir() {
  if (process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'producto-uploads')
  }

  return path.join(process.cwd(), 'public', 'uploads', 'productos')
}

function getFileExtension(file: File) {
  const byMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }

  return file.name.split('.').pop()?.toLowerCase() || byMime[file.type] || 'jpg'
}

function shouldUseLocalFallback(error: unknown) {
  return process.env.NODE_ENV !== 'production'
}

function toStorageErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
    return 'Vercel Blob Storage no está configurado. Configurá BLOB_READ_WRITE_TOKEN en las variables de entorno.'
  }

  return error instanceof Error ? error.message : String(error)
}

async function uploadProductImageLocally(file: File) {
  const uploadDir = getLocalUploadDir()
  const extension = getFileExtension(file)
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
  const filepath = path.join(uploadDir, filename)

  await mkdir(uploadDir, { recursive: true })
  await writeFile(filepath, Buffer.from(await file.arrayBuffer()))

  const isProduction = process.env.NODE_ENV === 'production'
  const publicUrl = isProduction
    ? `/api/admin/uploads/serve?file=${encodeURIComponent(filename)}`
    : `/uploads/productos/${encodeURIComponent(filename)}`

  return {
    filePath: filename,
    publicUrl,
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await hasAdminSession(req.cookies))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo no válido' }, { status: 400 })
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: 'Formato no soportado. Usa JPG, PNG o WEBP' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen supera 5MB' }, { status: 400 })
    }

    let upload
    try {
      upload = await uploadPublicAsset(file, 'productos')
    } catch (storageError) {
      if (!shouldUseLocalFallback(storageError)) {
        throw new Error(toStorageErrorMessage(storageError))
      }

      console.warn('Vercel Blob no disponible; usando fallback local para productos')
      upload = await uploadProductImageLocally(file)
    }

    return NextResponse.json({ url: upload.publicUrl, filePath: upload.filePath })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Error al subir imagen: ${errorMsg}` }, { status: 500 })
  }
}
