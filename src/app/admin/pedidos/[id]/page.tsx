'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChefHat,
  Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface OrderDetail {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerNotes: string | null
  adminNotes: string | null
  status: string
  paymentStatus: string
  paymentMethod: string
  stripePaymentId: string | null
  deliveryMethod: string
  pickupLocation: string | null
  pickupAddress: string | null
  pickupSchedule: string | null
  shippingAddress: string | null
  shippingCity: string | null
  shippingPostal: string | null
  subtotal: number
  shippingCost: number
  total: number
  weekId: string
  createdAt: string
  paidAt: string | null
  deliveredAt: string | null
  updatedAt: string
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
    sliced: boolean
    product: { slug: string; imageUrl: string; imageAlt: string }
  }>
  user: { id: string; email: string; name: string } | null
}

// ─────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────
const STATUS_FLOW = ['PENDING', 'PAID', 'BAKING', 'READY', 'DELIVERED']

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  PENDING:   { label: 'Pendiente',  icon: Clock,         color: 'text-yellow-600', bg: 'bg-yellow-100' },
  PAID:      { label: 'Pagado',     icon: CreditCard,    color: 'text-blue-600',   bg: 'bg-blue-100' },
  BAKING:    { label: 'En horno',   icon: ChefHat,       color: 'text-orange-600', bg: 'bg-orange-100' },
  READY:     { label: 'Listo',      icon: CheckCircle2,  color: 'text-green-600',  bg: 'bg-green-100' },
  DELIVERED: { label: 'Entregado',  icon: Truck,         color: 'text-gray-600',   bg: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelado',  icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-100' },
}

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Sin pagar',     color: 'text-yellow-600' },
  PAID:    { label: 'Cobrado',        color: 'text-emerald-600' },
  FAILED:  { label: 'Pago fallido',   color: 'text-red-600' },
}

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP_POINT:     'Recogida en punto',
  LOCAL_DELIVERY:   'Envío local',
  NATIONAL_COURIER: 'Mensajería nacional',
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

function formatDate(str: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(str))
}

// ─────────────────────────────────────────────
// Componente sección
// ─────────────────────────────────────────────
function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Icon className="w-4 h-4 text-amber-600" />
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={cn('text-sm text-gray-800', mono && 'font-mono')}>{value ?? '—'}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// Página de detalle
// ─────────────────────────────────────────────
export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/admin/pedidos/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setOrder(data)
        setAdminNotes(data.adminNotes ?? '')
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (newStatus: string) => {
    if (!order) return
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch(`/api/admin/pedidos/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setOrder((prev) => prev ? { ...prev, status: updated.status, updatedAt: updated.updatedAt } : prev)
      setSaveMessage('Estado actualizado correctamente')
    } catch {
      setSaveMessage('Error al actualizar el estado')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  const saveNotes = async () => {
    if (!order) return
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch(`/api/admin/pedidos/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      })
      if (!res.ok) throw new Error()
      setSaveMessage('Notas guardadas')
    } catch {
      setSaveMessage('Error al guardar las notas')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Pedido no encontrado</p>
        <Link href="/admin/pedidos" className="text-amber-600 text-sm mt-2 inline-block hover:underline">
          Volver a pedidos
        </Link>
      </div>
    )
  }

  const currentStatusIdx = STATUS_FLOW.indexOf(order.status)
  const statusConfig = STATUS_CONFIG[order.status]
  const StatusIcon = statusConfig?.icon ?? Clock

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cabecera */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="mt-0.5 p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
            <span className={cn('flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium', statusConfig?.bg, statusConfig?.color)}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig?.label ?? order.status}
            </span>
            <span className={cn('text-sm font-medium', PAYMENT_CONFIG[order.paymentStatus]?.color ?? 'text-gray-600')}>
              {PAYMENT_CONFIG[order.paymentStatus]?.label ?? order.paymentStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Creado el {formatDate(order.createdAt)}
            {order.paidAt && ` · Pagado el ${formatDate(order.paidAt)}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(order.total)}</p>
        </div>
      </div>

      {/* Mensaje de guardado */}
      {saveMessage && (
        <div className={cn(
          'px-4 py-2.5 rounded-lg text-sm font-medium',
          saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        )}>
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Cambio de estado */}
          {order.status !== 'CANCELLED' && (
            <Section title="Cambiar estado" icon={Clock}>
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="flex items-center gap-1">
                  {STATUS_FLOW.map((st, idx) => {
                    const conf = STATUS_CONFIG[st]
                    const isPast = idx < currentStatusIdx
                    const isCurrent = idx === currentStatusIdx
                    return (
                      <div key={st} className="flex-1 flex items-center gap-1">
                        <div className={cn(
                          'flex-1 h-1.5 rounded-full transition-colors',
                          isPast || isCurrent ? 'bg-amber-500' : 'bg-gray-200'
                        )} />
                        {idx === STATUS_FLOW.length - 1 && (
                          <div className={cn(
                            'w-3 h-3 rounded-full border-2 transition-colors',
                            isCurrent ? 'border-amber-500 bg-amber-500' : isPast ? 'border-amber-500 bg-amber-500' : 'border-gray-300 bg-white'
                          )} />
                        )}
                      </div>
                    )
                  })}
                </div>
                {/* Botones de estado */}
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map((st) => {
                    const conf = STATUS_CONFIG[st]
                    const Icon = conf.icon
                    const isCurrent = order.status === st
                    return (
                      <button
                        key={st}
                        onClick={() => !isCurrent && updateStatus(st)}
                        disabled={isCurrent || saving}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
                          isCurrent
                            ? `${conf.bg} ${conf.color} border-transparent cursor-default`
                            : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50',
                          saving && 'opacity-50'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {conf.label}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => updateStatus('CANCELLED')}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              </div>
            </Section>
          )}

          {/* Productos */}
          <Section title="Productos del pedido" icon={Package}>
            <div className="divide-y divide-gray-50 -mx-5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.imageAlt}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} ud. × {formatCurrency(item.unitPrice)}
                      {item.sliced && ' · Rebanado'}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Envío</span>
                <span>{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : 'Gratis'}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-1">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </Section>

          {/* Notas de admin */}
          <Section title="Notas internas" icon={AlertCircle}>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Añadir notas internas sobre este pedido..."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">Estas notas no son visibles para el cliente</p>
              <button
                onClick={saveNotes}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Guardar notas
              </button>
            </div>
          </Section>
        </div>

        {/* Columna lateral */}
        <div className="space-y-5">
          {/* Cliente */}
          <Section title="Cliente" icon={User}>
            <div className="space-y-3">
              <Field label="Nombre" value={order.customerName} />
              <Field label="Email" value={
                <a href={`mailto:${order.customerEmail}`} className="text-amber-600 hover:underline">
                  {order.customerEmail}
                </a>
              } />
              <Field label="Teléfono" value={
                <a href={`tel:${order.customerPhone}`} className="text-amber-600 hover:underline">
                  {order.customerPhone}
                </a>
              } />
              {order.customerNotes && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Notas del cliente</p>
                  <p className="text-sm text-gray-700 italic">&ldquo;{order.customerNotes}&rdquo;</p>
                </div>
              )}
            </div>
          </Section>

          {/* Entrega */}
          <Section title="Entrega" icon={MapPin}>
            <div className="space-y-3">
              <Field label="Método" value={DELIVERY_LABELS[order.deliveryMethod] ?? order.deliveryMethod} />
              {order.deliveryMethod === 'PICKUP_POINT' ? (
                <>
                  <Field label="Punto de recogida" value={order.pickupLocation} />
                  <Field label="Dirección" value={order.pickupAddress} />
                  <Field label="Horario" value={order.pickupSchedule} />
                </>
              ) : (
                <>
                  <Field label="Dirección" value={order.shippingAddress} />
                  <Field label="Ciudad" value={order.shippingCity} />
                  <Field label="Código postal" value={order.shippingPostal} />
                </>
              )}
            </div>
          </Section>

          {/* Pago */}
          <Section title="Pago" icon={CreditCard}>
            <div className="space-y-3">
              <Field label="Estado" value={
                <span className={cn('font-medium', PAYMENT_CONFIG[order.paymentStatus]?.color)}>
                  {PAYMENT_CONFIG[order.paymentStatus]?.label ?? order.paymentStatus}
                </span>
              } />
              <Field label="Método" value={order.paymentMethod} />
              {order.stripePaymentId && (
                <Field label="ID de Stripe" value={order.stripePaymentId} mono />
              )}
              <Field label="Semana de producción" value={order.weekId} mono />
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
