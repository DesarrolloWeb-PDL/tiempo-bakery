import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { timeGating } from '@/lib/time-gating'

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

const createProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(5),
  price: z.number().positive(),
  weight: z.number().int().positive().nullable(),
  ingredients: z.string().min(2),
  allergens: z.array(z.string()).default([]),
  riskNote: z.string().nullable(),
  imageUrl: z.string().min(1),
  imageAlt: z.string().min(1),
  stockType: z.enum(['WEEKLY', 'UNLIMITED']),
  weeklyStock: z.number().int().min(0),
  allowSlicing: z.boolean(),
  isActive: z.boolean(),
  published: z.boolean().default(false),
  categoryId: z.string().min(1),
})

function buildData(parsed: z.infer<typeof createProductSchema>) {
  return {
    ...parsed,
    allergens: JSON.stringify(parsed.allergens ?? []),
  }
}

async function syncWeeklyStockForCurrentWeek(product: {
  id: string
  stockType: string
  isActive: boolean
  weeklyStock: number
}) {
  if (product.stockType !== 'WEEKLY' || !product.isActive) return

  const weekId = timeGating.getCurrentWeekId()
  const existing = await db.weeklyStock.findUnique({
    where: { productId_weekId: { productId: product.id, weekId } },
  })

  if (!existing) {
    await db.weeklyStock.create({
      data: {
        productId: product.id,
        weekId,
        maxStock: product.weeklyStock,
        currentStock: product.weeklyStock,
        reservedStock: 0,
      },
    })
    return
  }

  const sold = existing.maxStock - existing.currentStock - existing.reservedStock
  const nextCurrentStock = Math.max(0, product.weeklyStock - sold - existing.reservedStock)

  await db.weeklyStock.update({
    where: { id: existing.id },
    data: {
      maxStock: product.weeklyStock,
      currentStock: nextCurrentStock,
    },
  })
}

export async function GET() {
  try {
    let products: any[] = []
    let categories: any[] = []

    try {
      ;[products, categories] = await Promise.all([
        db.product.findMany({
          include: {
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { orderItems: true } },
          },
          orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
        }),
        db.category.findMany({
          select: { id: true, name: true, slug: true },
          orderBy: [{ name: 'asc' }],
        }),
      ])
    } catch (compatError) {
      console.warn('Admin productos fallback activado por incompatibilidad de esquema:', compatError)

      ;[products, categories] = await Promise.all([
        db.product.findMany({
          include: {
            category: { select: { id: true, name: true } },
          },
          orderBy: [{ name: 'asc' }],
        }),
        db.category.findMany({
          select: { id: true, name: true },
          orderBy: [{ name: 'asc' }],
        }),
      ])

      products = products.map((product) => ({
        ...product,
        _count: { orderItems: 0 },
      }))
    }

    const normalizedProducts = products.map((product) => {
      let allergens: string[] = []
      try {
        allergens = JSON.parse(product.allergens || '[]')
      } catch {
        allergens = []
      }

      return {
        ...product,
        allergens,
      }
    })

    return NextResponse.json({ products: normalizedProducts, categories })
  } catch (error) {
    console.error('Error fetching products for admin:', error)
    return NextResponse.json(mapDbError(error, 'Error al obtener productos'), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: buildData(parsed.data),
    })

    await syncWeeklyStockForCurrentWeek(product)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}
