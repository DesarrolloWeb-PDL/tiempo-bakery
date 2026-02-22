import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'
import { DEFAULT_CONFIG } from '@/lib/time-gating'

export const dynamic = 'force-dynamic'

const daySchema = z.number().int().min(0).max(6)
const hourSchema = z.number().int().min(0).max(23)
const minuteSchema = z.number().int().min(0).max(59)

const updateSchema = z.object({
  enabled: z.boolean(),
  openingDay: daySchema,
  openingHour: hourSchema,
  openingMinute: minuteSchema,
  closingDay: daySchema,
  closingHour: hourSchema,
  closingMinute: minuteSchema,
})

const KEYS = {
  enabled: 'time_gating_enabled',
  openingDay: 'opening_day',
  openingHour: 'opening_hour',
  openingMinute: 'opening_minute',
  closingDay: 'closing_day',
  closingHour: 'closing_hour',
  closingMinute: 'closing_minute',
} as const

function toInt(value: string | null | undefined, fallback: number) {
  if (value == null) return fallback
  const n = Number.parseInt(value, 10)
  return Number.isNaN(n) ? fallback : n
}

function toBool(value: string | null | undefined, fallback: boolean) {
  if (value == null) return fallback
  return value === 'true'
}

export async function GET() {
  try {
    const configs = await db.siteConfig.findMany({
      where: { key: { in: Object.values(KEYS) } },
    })

    const map = new Map(configs.map((cfg) => [cfg.key, cfg.value]))

    return NextResponse.json({
      enabled: toBool(map.get(KEYS.enabled), true),
      openingDay: toInt(map.get(KEYS.openingDay), DEFAULT_CONFIG.openingDay),
      openingHour: toInt(map.get(KEYS.openingHour), DEFAULT_CONFIG.openingHour),
      openingMinute: toInt(map.get(KEYS.openingMinute), DEFAULT_CONFIG.openingMinute),
      closingDay: toInt(map.get(KEYS.closingDay), DEFAULT_CONFIG.closingDay),
      closingHour: toInt(map.get(KEYS.closingHour), DEFAULT_CONFIG.closingHour),
      closingMinute: toInt(map.get(KEYS.closingMinute), DEFAULT_CONFIG.closingMinute),
    })
  } catch (error) {
    console.error('Error fetching preventa config:', error)
    return NextResponse.json({ error: 'Error al obtener la configuración de preventa' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    await db.$transaction([
      db.siteConfig.upsert({
        where: { key: KEYS.enabled },
        create: { key: KEYS.enabled, value: String(data.enabled) },
        update: { value: String(data.enabled) },
      }),
      db.siteConfig.upsert({
        where: { key: KEYS.openingDay },
        create: { key: KEYS.openingDay, value: String(data.openingDay) },
        update: { value: String(data.openingDay) },
      }),
      db.siteConfig.upsert({
        where: { key: KEYS.openingHour },
        create: { key: KEYS.openingHour, value: String(data.openingHour) },
        update: { value: String(data.openingHour) },
      }),
      db.siteConfig.upsert({
        where: { key: KEYS.openingMinute },
        create: { key: KEYS.openingMinute, value: String(data.openingMinute) },
        update: { value: String(data.openingMinute) },
      }),
      db.siteConfig.upsert({
        where: { key: KEYS.closingDay },
        create: { key: KEYS.closingDay, value: String(data.closingDay) },
        update: { value: String(data.closingDay) },
      }),
      db.siteConfig.upsert({
        where: { key: KEYS.closingHour },
        create: { key: KEYS.closingHour, value: String(data.closingHour) },
        update: { value: String(data.closingHour) },
      }),
      db.siteConfig.upsert({
        where: { key: KEYS.closingMinute },
        create: { key: KEYS.closingMinute, value: String(data.closingMinute) },
        update: { value: String(data.closingMinute) },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating preventa config:', error)
    return NextResponse.json({ error: 'Error al guardar la configuración de preventa' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await db.siteConfig.deleteMany({
      where: { key: { in: Object.values(KEYS) } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting preventa config:', error)
    return NextResponse.json({ error: 'Error al restablecer la configuración de preventa' }, { status: 500 })
  }
}
