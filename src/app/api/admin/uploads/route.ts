import { NextRequest, NextResponse } from 'next/server'
import { hasAdminSession } from '@/lib/admin-auth'
import { uploadPublicAsset } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    if (!hasAdminSession(req.cookies)) {
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

    const upload = await uploadPublicAsset(file, 'productos')

    console.log('Archivo guardado en storage persistente:', upload.filePath)
    return NextResponse.json({ url: upload.publicUrl, filePath: upload.filePath })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error uploading file:', errorMsg, error)
    return NextResponse.json({ error: `Error al subir imagen: ${errorMsg}` }, { status: 500 })
  }
}
