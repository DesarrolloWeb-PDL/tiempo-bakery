import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function mapDbError(error: unknown, fallback: string) {
  const payload: Record<string, string> = { error: fallback }
  if (!(error instanceof Error)) return payload
  payload.details = error.message

  if (error.message.includes('Environment variable not found: DATABASE_URL')) {
    payload.error = 'Configuracion incompleta: falta DATABASE_URL'
  } else if (error.message.includes('Environment variable not found: POSTGRES_URL')) {
    payload.error = 'Configuracion incompleta: falta POSTGRES_URL'
  } else if (error.message.includes("Can't reach database server")) {
    payload.error = 'No se puede conectar a la base de datos'
  } else if (error.message.includes('does not exist')) {
    payload.error = 'La base de datos no esta migrada o faltan tablas'
  }

  return payload
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
    const skip = (page - 1) * limit

    type WhereClause = {
      status?: string
      paymentStatus?: string
      OR?: Array<{
        orderNumber?: { contains: string }
        customerName?: { contains: string }
        customerEmail?: { contains: string }
      }>
    }

    const where: WhereClause = {}
    if (status && status !== 'ALL') where.status = status
    if (paymentStatus && paymentStatus !== 'ALL') where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          total: true,
          subtotal: true,
          shippingCost: true,
          status: true,
          paymentStatus: true,
          deliveryMethod: true,
          pickupLocation: true,
          weekId: true,
          createdAt: true,
          paidAt: true,
          items: {
            select: {
              productName: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              sliced: true,
            },
          },
        },
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json(mapDbError(error, 'Error al obtener pedidos'), { status: 500 })
  }
}
