import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

function mapDbError(error: unknown, fallback: string) {
  const payload: Record<string, string> = { error: fallback }
  if (!(error instanceof Error)) return payload

  const configuredDbUrl = process.env.DATABASE_URL ?? ''
  payload.details = error.message

  if (error.message.includes('Environment variable not found: DATABASE_URL')) {
    payload.error = 'Configuración incompleta: falta DATABASE_URL'
  } else if (error.message.includes('Environment variable not found: POSTGRES_URL')) {
    payload.error = 'Configuración incompleta: falta POSTGRES_URL'
  } else if (error.message.includes("Can't reach database server")) {
    payload.error = 'No se puede conectar a la base de datos'
    try {
      const host = configuredDbUrl ? new URL(configuredDbUrl).hostname : ''
      if (host === 'localhost' || host === '127.0.0.1') {
        payload.error = 'No se puede conectar a la base de datos: DATABASE_URL apunta a localhost en producción'
      } else if (configuredDbUrl && !configuredDbUrl.includes('sslmode=')) {
        payload.error = 'No se puede conectar a la base de datos: revisá sslmode=require en DATABASE_URL'
      }
    } catch {
      // noop
    }
  } else if (error.message.includes('does not exist')) {
    payload.error = 'La base de datos no está migrada o faltan tablas'
  }

  return payload
}

const themeSchema = z.object({
  appTitle: z.string().min(1).max(100),
  appSubtitle: z.string().max(200),
  logoUrl: z.string().min(1).max(500).optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i),
})

type ThemeConfig = z.infer<typeof themeSchema>

const DEFAULT_THEME: ThemeConfig = {
  appTitle: 'Tiempo Bakery',
  appSubtitle: 'Panadería artesanal con preventa semanal',
  logoUrl: '/img/espiga.png',
  primaryColor: '#d89a44',
  secondaryColor: '#2c2c2c',
  accentColor: '#f5f5f5',
}

export async function GET() {
  try {
    const configs = await db.siteConfig.findMany({
      where: {
        key: {
          in: [
            'theme_appTitle',
            'theme_appSubtitle',
            'theme_logoUrl',
            'theme_primaryColor',
            'theme_secondaryColor',
            'theme_accentColor',
          ],
        },
      },
    })

    const theme: Partial<ThemeConfig> = {}
    configs.forEach((config) => {
      const key = config.key.replace('theme_', '') as keyof ThemeConfig
      ;(theme as any)[key] = config.value
    })

    return NextResponse.json({ ...DEFAULT_THEME, ...theme })
  } catch (error) {
    console.error('Error fetching theme config:', error)
    return NextResponse.json({ ...DEFAULT_THEME })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[Theme PUT] Received body:', body)
    const parsed = themeSchema.safeParse(body)

    if (!parsed.success) {
      console.error('[Theme PUT] Validation error:', parsed.error.flatten())
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    console.log('[Theme PUT] Validation passed, saving...')

    const updates = Object.entries(parsed.data).map(([key, value]) =>
      db.siteConfig.upsert({
        where: { key: `theme_${key}` },
        create: { key: `theme_${key}`, value: String(value) },
        update: { value: String(value) },
      })
    )

    await db.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating theme config:', error)
    return NextResponse.json(mapDbError(error, 'Error al guardar configuración de tema'), { status: 500 })
  }
}

export async function DELETE() {
  try {
    const keys = [
      'theme_appTitle',
      'theme_appSubtitle',
      'theme_logoUrl',
      'theme_primaryColor',
      'theme_secondaryColor',
      'theme_accentColor',
    ]

    const updates = Object.entries(DEFAULT_THEME).map(([key, value]) =>
      db.siteConfig.upsert({
        where: { key: `theme_${key}` },
        create: { key: `theme_${key}`, value: String(value) },
        update: { value: String(value) },
      })
    )

    await db.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting theme config:', error)
    return NextResponse.json(mapDbError(error, 'Error al restablecer tema'), { status: 500 })
  }
}
