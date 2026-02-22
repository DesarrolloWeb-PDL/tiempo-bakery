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

// GET /api/admin/stock?weekId=2025-W08
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weekId = searchParams.get('weekId')

    if (!weekId) {
      return NextResponse.json({ error: 'Se requiere weekId' }, { status: 400 })
    }

    // Todos los productos activos
    const products = await db.product.findMany({
      where: { isActive: true, stockType: 'WEEKLY' },
      include: {
        weeklyStocks: { where: { weekId } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    })

    const rows = products.map((p: typeof products[number]) => {
      const ws = p.weeklyStocks[0] ?? null
      return {
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        productImage: p.imageUrl,
        category: p.category.name,
        defaultWeeklyStock: p.weeklyStock,
        weekStockId: ws?.id ?? null,
        maxStock: ws?.maxStock ?? 0,
        currentStock: ws?.currentStock ?? 0,
        reservedStock: ws?.reservedStock ?? 0,
        soldStock: ws ? ws.maxStock - ws.currentStock - ws.reservedStock : 0,
        hasStock: ws !== null,
      }
    })

    return NextResponse.json({ weekId, rows })
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json(mapDbError(error, 'Error al obtener stock'), { status: 500 })
  }
}

// POST /api/admin/stock — crear / actualizar stock de productos para una semana
const upsertSchema = z.object({
  weekId: z.string().regex(/^\d{4}-W\d{2}$/, 'Formato de semana inválido (YYYY-Www)'),
  items: z.array(
    z.object({
      productId: z.string(),
      maxStock: z.number().int().min(0),
    })
  ).min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = upsertSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { weekId, items } = parsed.data

    const results = await Promise.all(
      items.map(async ({ productId, maxStock }) => {
        const existing = await db.weeklyStock.findUnique({
          where: { productId_weekId: { productId, weekId } },
        })

        if (existing) {
          // Si el maxStock cambia, ajustar currentStock proporcionalmente
          const sold = existing.maxStock - existing.currentStock - existing.reservedStock
          const newCurrentStock = Math.max(0, maxStock - sold - existing.reservedStock)
          return db.weeklyStock.update({
            where: { id: existing.id },
            data: { maxStock, currentStock: newCurrentStock },
          })
        } else {
          return db.weeklyStock.create({
            data: { productId, weekId, maxStock, currentStock: maxStock, reservedStock: 0 },
          })
        }
      })
    )

    return NextResponse.json({ updated: results.length, weekId })
  } catch (error) {
    console.error('Error upserting stock:', error)
    return NextResponse.json(mapDbError(error, 'Error al actualizar stock'), { status: 500 })
  }
}
