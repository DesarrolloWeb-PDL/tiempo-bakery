import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
    const now = new Date()

    // Semana actual en formato ISO (YYYY-Www)
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const weekNum = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    )
    const currentWeekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`

    // Inicio de la semana actual (lunes)
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)

    // Inicio del mes actual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Inicio del mes anterior
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [
      // Pedidos totales / pagados
      totalOrders,
      paidOrders,
      pendingOrders,
      // Pedidos de esta semana
      weekOrders,
      // Pedidos del mes
      monthOrders,
      monthOrdersLast,
      // Ventas del mes
      monthRevenue,
      monthRevenueLast,
      // Clientes únicos
      totalCustomers,
      // Pedidos recientes
      recentOrders,
      // Stock de esta semana
      weekStock,
    ] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { paymentStatus: 'PAID' } }),
      db.order.count({ where: { status: 'PENDING', paymentStatus: 'PENDING' } }),
      db.order.count({ where: { createdAt: { gte: startOfWeek } } }),
      db.order.count({ where: { createdAt: { gte: startOfMonth }, paymentStatus: 'PAID' } }),
      db.order.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, paymentStatus: 'PAID' },
      }),
      db.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfMonth }, paymentStatus: 'PAID' },
      }),
      db.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          paymentStatus: 'PAID',
        },
      }),
      db.user.count(),
      db.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerEmail: true,
          total: true,
          status: true,
          paymentStatus: true,
          deliveryMethod: true,
          createdAt: true,
          items: { select: { quantity: true } },
        },
      }),
      db.weeklyStock.findMany({
        where: { weekId: currentWeekId },
        include: {
          product: { select: { name: true, slug: true, imageUrl: true } },
        },
        orderBy: { product: { name: 'asc' } },
      }),
    ])

    const currentRevenue = monthRevenue._sum.total ?? 0
    const lastRevenue = monthRevenueLast._sum.total ?? 0
    const revenueGrowth =
      lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : null

    const ordersGrowth =
      monthOrdersLast > 0
        ? ((monthOrders - monthOrdersLast) / monthOrdersLast) * 100
        : null

    return NextResponse.json({
      summary: {
        totalOrders,
        paidOrders,
        pendingOrders,
        weekOrders,
        totalCustomers,
        monthRevenue: currentRevenue,
        monthOrders,
        revenueGrowth,
        ordersGrowth,
      },
      recentOrders,
      weekStock: weekStock.map((ws: typeof weekStock[number]) => ({
        id: ws.id,
        productId: ws.productId,
        productName: ws.product.name,
        productSlug: ws.product.slug,
        productImage: ws.product.imageUrl,
        weekId: ws.weekId,
        maxStock: ws.maxStock,
        currentStock: ws.currentStock,
        reservedStock: ws.reservedStock,
        soldStock: ws.maxStock - ws.currentStock - ws.reservedStock,
      })),
      currentWeekId,
    })
  } catch (error) {
    console.error('Error fetching admin metrics:', error)
    return NextResponse.json(mapDbError(error, 'Error al obtener métricas'), { status: 500 })
  }
}
