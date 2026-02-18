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

    const ext = getExtension(file.name, file.type)
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`

    // Usar __dirname aproximado o path absoluto más seguro
    const basePath = process.cwd()
    const uploadDir = path.join(basePath, 'public', 'uploads', 'productos')
    
    console.log('Directorio de upload:', uploadDir)

    await mkdir(uploadDir, { recursive: true })

    const fullPath = path.join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    
    console.log('Escribiendo archivo:', { path: fullPath, size: buffer.length })
    
    await writeFile(fullPath, buffer)

    console.log('Archivo guardado exitosamente')
    return NextResponse.json({ url: `/uploads/productos/${fileName}` })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error uploading file:', errorMsg, error)
    return NextResponse.json({ error: `Error al subir imagen: ${errorMsg}` }, { status: 500 })
  }
}
