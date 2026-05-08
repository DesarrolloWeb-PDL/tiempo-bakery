import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma as db } from '@/lib/db'
import { getSiteContent } from '@/lib/site-content'
import { DEFAULT_SITE_CONTENT, SITE_CONTENT_KEYS } from '@/lib/site-content.shared'

export const dynamic = 'force-dynamic'

const siteContentSchema = z.object({
  navProductsLabel: z.string().min(1).max(40),
  navAboutLabel: z.string().min(1).max(40),
  navContactLabel: z.string().min(1).max(40),
  footerDescription: z.string().min(1).max(300),
  footerScheduleTitle: z.string().min(1).max(60),
  footerScheduleText: z.string().min(1).max(120),
  footerDeliveryText: z.string().min(1).max(120),
  footerContactTitle: z.string().min(1).max(60),
  footerLegalNote: z.string().min(1).max(220),
  contactEmail: z.string().email().max(120),
  contactPhone: z.string().min(1).max(60),
  contactWhatsapp: z.string().min(1).max(60),
  contactAddress: z.string().min(1).max(180),
  aboutTitle: z.string().min(1).max(100),
  aboutBody: z.string().min(1).max(1200),
  aboutSecondaryBody: z.string().min(1).max(1200),
  contactTitle: z.string().min(1).max(100),
  contactIntro: z.string().min(1).max(500),
  deliveryPickupText: z.string().min(1).max(400),
  deliveryLocalText: z.string().min(1).max(400),
  deliveryCourierText: z.string().min(1).max(400),
})

function mapDbError(error: unknown, fallback: string) {
  const payload: Record<string, string> = { error: fallback }
  if (!(error instanceof Error)) return payload

  payload.details = error.message

  if (error.message.includes('Environment variable not found: DATABASE_URL')) {
    payload.error = 'Configuración incompleta: falta DATABASE_URL'
  } else if (error.message.includes("Can't reach database server")) {
    payload.error = 'No se puede conectar a la base de datos'
  } else if (error.message.includes('does not exist')) {
    payload.error = 'La base de datos no está migrada o faltan tablas'
  }

  return payload
}

export async function GET() {
  try {
    const content = await getSiteContent()
    return NextResponse.json(content)
  } catch (error) {
    return NextResponse.json(mapDbError(error, 'Error al obtener la configuración del sitio'), {
      status: 500,
    })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = siteContentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    await db.$transaction(
      SITE_CONTENT_KEYS.map((key) =>
        db.siteConfig.upsert({
          where: { key: `content_${key}` },
          create: { key: `content_${key}`, value: parsed.data[key] },
          update: { value: parsed.data[key] },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(mapDbError(error, 'Error al guardar la configuración del sitio'), {
      status: 500,
    })
  }
}

export async function DELETE() {
  try {
    await db.$transaction(
      SITE_CONTENT_KEYS.map((key) =>
        db.siteConfig.upsert({
          where: { key: `content_${key}` },
          create: { key: `content_${key}`, value: DEFAULT_SITE_CONTENT[key] },
          update: { value: DEFAULT_SITE_CONTENT[key] },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      mapDbError(error, 'Error al restablecer la configuración del sitio'),
      { status: 500 }
    )
  }
}