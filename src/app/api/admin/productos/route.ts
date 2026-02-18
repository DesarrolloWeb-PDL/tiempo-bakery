import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const products = await db.product.findMany({
      include: {
        category: { select: { name: true, slug: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: [{ category: { order: 'asc' } }, { name: 'asc' }],
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products for admin:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
