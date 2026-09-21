'use client'

import React, { useMemo, useState } from 'react'
import { RefreshCw, Truck, User, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStatusLabel } from '@/lib/order-status'
import type { AssignableOrder, DeliveryAssignment, DeliveryPerson } from '@/types/delivery'

const BOARD_COLUMNS = [
  { key: 'READY', label: 'Listos para asignar', icon: Clock },
  { key: 'OUT_FOR_DELIVERY', label: 'En camino', icon: Truck },
  { key: 'DELIVERY_FAILED', label: 'Fallidos', icon: AlertCircle },
  { key: 'DELIVERED', label: 'Entregados', icon: CheckCircle2 },
] as const

const COLUMN_COLORS: Record<string, string> = {
  READY: 'border-gray-700',
  OUT_FOR_DELIVERY: 'border-brand-gold/50',
  DELIVERY_FAILED: 'border-red-800',
  DELIVERED: 'border-green-800',
}

type AssignmentSectionProps = {
  orders: AssignableOrder[]
  assignments: DeliveryAssignment[]
  persons: DeliveryPerson[]
  loading: boolean
  onRefresh: () => void
  onAssign: (orderId: string, personId: string) => void
}

export function AssignmentSection({
  orders,
  assignments,
  persons,
  loading,
  onRefresh,
  onAssign,
}: AssignmentSectionProps) {
  const [selectedPerson, setSelectedPerson] = useState<Record<string, string>>({})

  const assignmentsByOrderId = useMemo(() => {
    const map = new Map<string, DeliveryAssignment>()
    for (const assignment of assignments) {
      map.set(assignment.orderId, assignment)
    }
    return map
  }, [assignments])

  const columns = useMemo(() => {
    return BOARD_COLUMNS.map((col) => ({
      ...col,
      orders: orders.filter((o) => o.status === col.key),
    }))
  }, [orders])

  const activePersons = persons.filter((p) => p.isActive)

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
        <div>
          <h3 className="font-semibold text-white text-sm">Asignaciones de reparto</h3>
          <p className="text-xs text-gray-400 mt-1">
            Asigná repartidores a pedidos locales y seguí su estado.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Actualizar asignaciones"
          className="px-3 py-2 bg-white text-gray-300 text-sm rounded-lg border border-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-w-[800px]">
          {columns.map((col) => {
            const Icon = col.icon
            return (
              <div
                key={col.key}
                className={cn(
                  'bg-gray-900/50 border-t-4 rounded-lg p-3 space-y-3',
                  COLUMN_COLORS[col.key]
                )}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Icon className="w-4 h-4 text-brand-gold" />
                  {col.label}
                  <span className="ml-auto text-xs text-gray-400">{col.orders.length}</span>
                </div>

                <div className="space-y-2">
                  {col.orders.map((order) => {
                    const assignment = assignmentsByOrderId.get(order.id)
                    return (
                      <div
                        key={order.id}
                        className="rounded-lg border border-gray-700 bg-gray-800 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">{order.orderNumber}</p>
                            <p className="text-xs text-gray-400">{order.customerName}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                            {getStatusLabel(order.status as never)}
                          </span>
                        </div>

                        {assignment ? (
                          <p className="text-xs text-gray-300 flex items-center gap-1">
                            <User className="w-3 h-3 text-brand-gold" />
                            {assignment.deliveryPerson?.name ?? 'Sin repartidor'}
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            <select
                              value={selectedPerson[order.id] ?? ''}
                              disabled={loading || activePersons.length === 0}
                              onChange={(e) =>
                                setSelectedPerson((prev) => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              className="w-full text-xs border border-gray-700 rounded-lg px-2 py-1.5 bg-gray-900 text-white"
                            >
                              <option value="">
                                {activePersons.length === 0
                                  ? 'No hay repartidores activos'
                                  : 'Seleccionar repartidor'}
                              </option>
                              {activePersons.map((person) => (
                                <option key={person.id} value={person.id}>
                                  {person.name}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() =>
                                selectedPerson[order.id] &&
                                onAssign(order.id, selectedPerson[order.id])
                              }
                              disabled={loading || !selectedPerson[order.id]}
                              className="w-full px-2 py-1.5 bg-brand-gold text-white text-xs rounded-lg hover:bg-brand-gold-dark disabled:opacity-50"
                            >
                              Asignar
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {col.orders.length === 0 && (
                    <p className="text-xs text-gray-500 italic">No hay pedidos en este estado.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
