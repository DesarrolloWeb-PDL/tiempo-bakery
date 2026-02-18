import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { z } from 'zod'

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

// PATCH para cambiar solo el estado published
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { published } = body

    if (typeof published !== 'boolean') {
      return NextResponse.json(
        { error: 'published debe ser un booleano' },
        { status: 400 }
      )
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: { published },
    })

    return NextResponse.json({ published: product.published })
  } catch (error) {
    console.error('Error updating product published status:', error)
    return NextResponse.json(
      { error: 'Error al cambiar estado de publicación' },
      { status: 500 }
    )
  }
}
