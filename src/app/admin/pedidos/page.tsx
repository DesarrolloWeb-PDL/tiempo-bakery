'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  total: number
  status: string
  paymentStatus: string
  deliveryMethod: string
  pickupLocation: string | null
  weekId: string
  createdAt: string
  paidAt: string | null
  items: Array<{ quantity: number; productName: string }>
}

interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─────────────────────────────────────────────
// Constantes de UI
// ─────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'BAKING', label: 'En horno' },
  { value: 'READY', label: 'Listo' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const PAYMENT_OPTIONS = [
  { value: 'ALL', label: 'Todos los pagos' },
  { value: 'PENDING', label: 'Pago pendiente' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'FAILED', label: 'Fallido' },
]

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  PAID:      'bg-blue-100 text-blue-700',
  BAKING:    'bg-orange-100 text-orange-700',
  READY:     'bg-green-100 text-green-700',
  DELIVERED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', PAID: 'Pagado', BAKING: 'En horno',
  READY: 'Listo', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
}

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-600',
  PAID:    'bg-emerald-50 text-emerald-700',
  FAILED:  'bg-red-50 text-red-600',
}

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Sin pagar', PAID: 'Cobrado', FAILED: 'Fallido',
}

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP_POINT:     '📍 Recogida',
  LOCAL_DELIVERY:   '🚴 Local',
  NATIONAL_COURIER: '📦 Nacional',
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

function formatDate(str: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

// ─────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────
function PedidosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<OrdersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? 'ALL')
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('paymentStatus') ?? 'ALL')
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'))

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status !== 'ALL') params.set('status', status)
      if (paymentStatus !== 'ALL') params.set('paymentStatus', paymentStatus)
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await fetch(`/api/admin/pedidos?${params.toString()}`)
      if (!res.ok) throw new Error('Error')
      setData(await res.json())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [search, status, paymentStatus, page])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Reset a página 1 cuando cambian los filtros
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setPage(1)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pedidos</h2>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.pagination.total} pedido{data.pagination.total !== 1 ? 's' : ''} en total
            </p>
          )}
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nº pedido, nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={status}
              onChange={(e) => handleFilterChange(setStatus)(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Pago */}
          <select
            value={paymentStatus}
            onChange={(e) => handleFilterChange(setPaymentStatus)(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white"
          >
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : !data || data.orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No se encontraron pedidos
          </div>
        ) : (
          <>
            {/* Cabecera tabla (desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <div className="col-span-2">Número</div>
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2">Pago</div>
              <div className="col-span-2">Entrega</div>
              <div className="col-span-1 text-right">Total</div>
            </div>

            <div className="divide-y divide-gray-50">
              {data.orders.map((order) => {
                const totalItems = order.items.reduce((s, i) => s + i.quantity, 0)
                return (
                  <Link
                    key={order.id}
                    href={`/admin/pedidos/${order.id}`}
                    className="flex md:grid md:grid-cols-12 gap-4 px-5 py-4 hover:bg-amber-50/40 transition-colors items-center group"
                  >
                    {/* Número */}
                    <div className="md:col-span-2 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>

                    {/* Cliente */}
                    <div className="md:col-span-3 min-w-0 hidden md:block">
                      <p className="text-sm text-gray-800 truncate">{order.customerName}</p>
                      <p className="text-xs text-gray-400 truncate">{order.customerEmail}</p>
                    </div>

                    {/* Estado */}
                    <div className="md:col-span-2">
                      <span
                        className={cn(
                          'inline-block text-xs px-2 py-1 rounded-full font-medium',
                          STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>

                    {/* Pago (desktop) */}
                    <div className="md:col-span-2 hidden md:block">
                      <span
                        className={cn(
                          'inline-block text-xs px-2 py-1 rounded-full font-medium',
                          PAYMENT_STYLES[order.paymentStatus] ?? 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
                      </span>
                    </div>

                    {/* Entrega */}
                    <div className="md:col-span-2 hidden md:block">
                      <p className="text-sm text-gray-600">
                        {DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
                      </p>
                      <p className="text-xs text-gray-400">{totalItems} ud{totalItems !== 1 ? 's' : ''}.</p>
                    </div>

                    {/* Total + icono */}
                    <div className="md:col-span-1 flex items-center justify-end gap-1 ml-auto md:ml-0">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-500 transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Paginación */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Página {data.pagination.page} de {data.pagination.totalPages} · {data.pagination.total} resultados
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page >= data.pagination.totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminPedidosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400 text-sm">Cargando pedidos...</div>}>
      <PedidosContent />
    </Suspense>
  )
}
