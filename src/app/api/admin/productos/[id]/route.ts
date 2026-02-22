import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'
import { timeGating } from '@/lib/time-gating'

export const dynamic = 'force-dynamic'

const productSchema = z.object({
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

function buildData(parsed: z.infer<typeof productSchema>) {
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: buildData(parsed.data),
    })

    await syncWeeklyStockForCurrentWeek(product)

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Error al actualizar el producto' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.product.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Error al eliminar el producto' }, { status: 500 })
  }
}

// PATCH flexible: permite actualizar imageUrl, published y otros campos simples
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    // Solo permitir actualizar campos simples y seguros
    const allowedFields = ['imageUrl', 'published', 'imageAlt'];
    const data: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) data[key] = body[key];
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No hay campos válidos para actualizar.' }, { status: 400 });
    }
    const product = await db.product.update({
      where: { id: params.id },
      data,
    });
    // Si se publica, sincronizar stock semanal
    if ('published' in data && product.published) {
      await syncWeeklyStockForCurrentWeek(product);
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error en PATCH de producto:', error);
    return NextResponse.json({ error: 'Error al actualizar el producto' }, { status: 500 });
  }
}
