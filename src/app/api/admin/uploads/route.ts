import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024

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

    const ext = getExtension(file.name, file.type)
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'productos')
    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadDir, fileName), buffer)

    return NextResponse.json({ url: `/uploads/productos/${fileName}` })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 })
  }
}
