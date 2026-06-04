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
  if (!(error instanceof Error)) {
    return false
  }

  if (error.message.includes('para usar Supabase Storage')) {
    return true
  }

  return process.env.NODE_ENV !== 'production'
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

    console.log('Preparando upload persistente:', { name: file.name, type: file.type })

    let upload
    try {
      upload = await uploadPublicAsset(file, 'productos')
    } catch (storageError) {
      if (!shouldUseLocalFallback(storageError)) {
        throw storageError
      }

      console.warn('Supabase no configurado; usando fallback local para productos')
      upload = await uploadProductImageLocally(file)
    }

    console.log('Archivo guardado en storage persistente:', upload.filePath)
    return NextResponse.json({ url: upload.publicUrl, filePath: upload.filePath })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error uploading file:', errorMsg, error)
    return NextResponse.json({ error: `Error al subir imagen: ${errorMsg}` }, { status: 500 })
  }
}
