import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'img')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

export async function POST(req: NextRequest) {
  try {
    console.log('[Logo Upload] Request received')

    // Check auth
    const authHeader = req.headers.get('cookie')
    if (!authHeader?.includes('adminSession=')) {
      console.log('[Logo Upload] Unauthorized - no session')
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
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true })
      console.log(`[Logo Upload] Directory ready: ${UPLOAD_DIR}`)
    } catch (err) {
      console.log('[Logo Upload] Error creating directory:', err)
      throw new Error('Cannot create upload directory')
    }

    // Generate unique filename
    const ext = path.extname(file.name)
    const randomName = crypto.randomBytes(8).toString('hex')
    const filename = `logo-${randomName}${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    console.log(`[Logo Upload] Saving to: ${filepath}`)

    // Convert file to buffer and write
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filepath, buffer)
    console.log(`[Logo Upload] File written successfully`)

    // Return accessible URL (relative to /public)
    const url = `/img/${filename}`
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
