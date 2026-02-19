'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  TrendingUp,
  Users,
  Euro,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface MetricsData {
  summary: {
    totalOrders: number
    paidOrders: number
    pendingOrders: number
    weekOrders: number
    totalCustomers: number
    monthRevenue: number
    monthOrders: number
    revenueGrowth: number | null
    ordersGrowth: number | null
  }
  recentOrders: Array<{
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string
    total: number
    status: string
    paymentStatus: string
    deliveryMethod: string
    createdAt: string
    items: Array<{ quantity: number }>
  }>
  weekStock: Array<{
    id: string
    productName: string
    productImage: string
    weekId: string
    maxStock: number
    currentStock: number
    reservedStock: number
    soldStock: number
  }>
  currentWeekId: string
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'Pendiente',  className: 'bg-yellow-100 text-yellow-700' },
  PAID:      { label: 'Pagado',     className: 'bg-blue-100 text-blue-700' },
  BAKING:    { label: 'En horno',   className: 'bg-orange-100 text-orange-700' },
  READY:     { label: 'Listo',      className: 'bg-green-100 text-green-700' },
  DELIVERED: { label: 'Entregado',  className: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Cancelado',  className: 'bg-red-100 text-red-700' },
}

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP_POINT:      '📍 Recogida',
  LOCAL_DELIVERY:    '🚴 Local',
  NATIONAL_COURIER:  '📦 Nacional',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

// ─────────────────────────────────────────────
// Componente Tarjeta de Métrica
// ─────────────────────────────────────────────
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  growth,
  iconColor,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  growth?: number | null
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {growth !== undefined && growth !== null && (
        <div className="mt-3 flex items-center gap-1">
          {growth >= 0 ? (
            <ArrowUpRight className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span className={cn('text-sm font-medium', growth >= 0 ? 'text-green-600' : 'text-red-600')}>
            {Math.abs(growth).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">vs mes anterior</span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Componente Barra de Stock
// ─────────────────────────────────────────────
function StockBar({ soldStock, reservedStock, currentStock, maxStock }: {
  soldStock: number
  reservedStock: number
  currentStock: number
  maxStock: number
}) {
  const soldPct = maxStock > 0 ? (soldStock / maxStock) * 100 : 0
  const reservedPct = maxStock > 0 ? (reservedStock / maxStock) * 100 : 0
  const availPct = maxStock > 0 ? (currentStock / maxStock) * 100 : 0

  return (
    <div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden flex">
        <div className="bg-green-500 h-2 transition-all" style={{ width: `${soldPct}%` }} />
        <div className="bg-yellow-400 h-2 transition-all" style={{ width: `${reservedPct}%` }} />
        <div className="bg-gray-200 h-2 transition-all" style={{ width: `${availPct}%` }} />
      </div>
      <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Vendido: {soldStock}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          Reservado: {reservedStock}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
          Libre: {currentStock}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Página principal del Dashboard
// ─────────────────────────────────────────────
export default function AdminDashboard() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/metrics')
      if (!res.ok) {
        const raw = await res.text()
        let data: { error?: string; details?: string } = {}
        try {
          data = JSON.parse(raw)
        } catch {
          data = {}
        }
        const fallback = raw
          ? `HTTP ${res.status}: ${raw.replace(/\s+/g, ' ').slice(0, 180)}`
          : `HTTP ${res.status}`
        throw new Error(data.error || data.details || fallback)
      }
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las métricas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Actualizar cada 2 minutos
    const interval = setInterval(fetchData, 120_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {lastUpdated
              ? `Actualizado a las ${lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
              : 'Cargando datos...'}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Skeleton / Métricas */}
      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Tarjetas de métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Ventas este mes"
              value={formatCurrency(data.summary.monthRevenue)}
              subtitle={`${data.summary.monthOrders} pedidos pagados`}
              icon={Euro}
              growth={data.summary.revenueGrowth}
              iconColor="bg-green-100 text-green-600"
            />
            <MetricCard
              title="Pedidos este mes"
              value={data.summary.monthOrders}
              subtitle={`${data.summary.weekOrders} esta semana`}
              icon={ShoppingBag}
              growth={data.summary.ordersGrowth}
              iconColor="bg-blue-100 text-blue-600"
            />
            <MetricCard
              title="Pedidos pendientes"
              value={data.summary.pendingOrders}
              subtitle="Esperando pago"
              icon={Clock}
              iconColor="bg-yellow-100 text-yellow-600"
            />
            <MetricCard
              title="Clientes registrados"
              value={data.summary.totalCustomers}
              subtitle={`${data.summary.totalOrders} pedidos totales`}
              icon={Users}
              iconColor="bg-purple-100 text-purple-600"
            />
          </div>

          {/* Semana actual */}
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-gray-700">
              Semana{' '}
              <span className="font-bold text-amber-700">{data.currentWeekId}</span>
            </span>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pedidos recientes */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Pedidos recientes</h3>
                <Link
                  href="/admin/pedidos"
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                >
                  Ver todos
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {data.recentOrders.length === 0 ? (
                  <div className="px-5 py-10 text-center text-gray-400 text-sm">
                    No hay pedidos todavía
                  </div>
                ) : (
                  data.recentOrders.map((order) => {
                    const status = STATUS_LABELS[order.status] ?? {
                      label: order.status,
                      className: 'bg-gray-100 text-gray-600',
                    }
                    const totalItems = order.items.reduce((s, i) => s + i.quantity, 0)
                    return (
                      <Link
                        key={order.id}
                        href={`/admin/pedidos/${order.id}`}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {order.orderNumber}
                            </span>
                            <span
                              className={cn(
                                'text-xs px-1.5 py-0.5 rounded-full font-medium',
                                status.className
                              )}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {order.customerName} · {DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod} · {totalItems} uds.
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(order.total)}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>

            {/* Stock semanal */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Stock semanal</h3>
                <Link
                  href="/admin/stock"
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                >
                  Gestionar
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {data.weekStock.length === 0 ? (
                  <div className="px-5 py-10 text-center text-gray-400 text-sm">
                    No hay stock configurado para esta semana
                  </div>
                ) : (
                  data.weekStock.map((ws) => (
                    <div key={ws.id} className="px-5 py-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-800 truncate flex-1">
                          {ws.productName}
                        </p>
                        <span className="text-xs text-gray-500 ml-2 shrink-0">
                          {ws.soldStock}/{ws.maxStock}
                        </span>
                      </div>
                      <StockBar
                        soldStock={ws.soldStock}
                        reservedStock={ws.reservedStock}
                        currentStock={ws.currentStock}
                        maxStock={ws.maxStock}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
