'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// Helpers de semana ISO
// ─────────────────────────────────────────────
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function offsetWeek(weekId: string, offset: number): string {
  const [year, wStr] = weekId.split('-W')
  const week = parseInt(wStr)
  // Primer día de la semana ISO
  const jan4 = new Date(Date.UTC(parseInt(year), 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1)
  const targetDate = new Date(startOfWeek1)
  targetDate.setUTCDate(startOfWeek1.getUTCDate() + (week - 1 + offset) * 7)
  return getISOWeek(targetDate)
}

function weekLabel(weekId: string): string {
  const [year, wStr] = weekId.split('-W')
  const week = parseInt(wStr)
  const jan4 = new Date(Date.UTC(parseInt(year), 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
  const mon = new Date(jan4)
  mon.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7)
  const sun = new Date(mon)
  sun.setUTCDate(mon.getUTCDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────
interface StockRow {
  productId: string
  productName: string
  productSlug: string
  productImage: string
  category: string
  defaultWeeklyStock: number
  weekStockId: string | null
  maxStock: number
  currentStock: number
  reservedStock: number
  soldStock: number
  hasStock: boolean
}

interface StockData {
  weekId: string
  rows: StockRow[]
}

// ─────────────────────────────────────────────
// Barra visual
// ─────────────────────────────────────────────
function MiniStockBar({ sold, reserved, free, max }: {
  sold: number; reserved: number; free: number; max: number
}) {
  if (max === 0) return null
  const soldPct = (sold / max) * 100
  const reservedPct = (reserved / max) * 100
  const freePct = (free / max) * 100
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 flex overflow-hidden mt-1">
      <div className="bg-green-500 h-1.5" style={{ width: `${soldPct}%` }} />
      <div className="bg-yellow-400 h-1.5" style={{ width: `${reservedPct}%` }} />
      <div className="bg-gray-200 h-1.5" style={{ width: `${freePct}%` }} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────
export default function AdminStockPage() {
  const [currentWeekId, setCurrentWeekId] = useState(getISOWeek(new Date()))
  const [data, setData] = useState<StockData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  // Edits: productId -> new maxStock value
  const [edits, setEdits] = useState<Record<string, number>>({})

  const fetchStock = useCallback(async () => {
    setLoading(true)
    setEdits({})
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/stock?weekId=${currentWeekId}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [currentWeekId])

  useEffect(() => {
    fetchStock()
  }, [fetchStock])

  const getMaxStock = (row: StockRow) =>
    edits[row.productId] !== undefined ? edits[row.productId] : row.maxStock

  const isDirty = Object.keys(edits).length > 0

  const handleSave = async () => {
    if (!data || !isDirty) return
    setSaving(true)
    setMessage(null)
    try {
      const items = data.rows
        .filter((r) => edits[r.productId] !== undefined)
        .map((r) => ({ productId: r.productId, maxStock: edits[r.productId] }))

      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId: currentWeekId, items }),
      })
      if (!res.ok) throw new Error()
      setMessage({ type: 'success', text: `Stock actualizado para ${currentWeekId}` })
      setEdits({})
      await fetchStock()
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar el stock. Inténtalo de nuevo.' })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  // Agrupar filas por categoría
  const grouped = data?.rows.reduce<Record<string, StockRow[]>>((acc, row) => {
    if (!acc[row.category]) acc[row.category] = []
    acc[row.category].push(row)
    return acc
  }, {}) ?? {}

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Stock Semanal</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configura las unidades disponibles por semana de producción
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar cambios
            </button>
          )}
          <button
            onClick={fetchStock}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Selector de semana */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
        <button
          onClick={() => setCurrentWeekId((w) => offsetWeek(w, -1))}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-gray-900">{currentWeekId}</p>
          <p className="text-sm text-gray-500">{weekLabel(currentWeekId)}</p>
        </div>
        <button
          onClick={() => setCurrentWeekId((w) => offsetWeek(w, 1))}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCurrentWeekId(getISOWeek(new Date()))}
          className="px-3 py-2 text-sm text-amber-600 font-medium bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
        >
          Hoy
        </button>
      </div>

      {/* Mensaje */}
      {message && (
        <div className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium',
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        )}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-4 h-4" />
            : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5">
        <Info className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="flex gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Vendido
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Reservado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" /> Disponible
          </span>
        </div>
        <span className="ml-auto">El campo &ldquo;Máx.&rdquo; es el único editable</span>
      </div>

      {/* Tabla de stock */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl divide-y animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-40" />
                <div className="h-2 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay productos con stock semanal</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, rows]) => (
            <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {category}
                </h4>
              </div>

              {/* Cabecera de columnas (desktop) */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 text-xs font-medium text-gray-400 border-b border-gray-50">
                <div className="col-span-4">Producto</div>
                <div className="col-span-5">Stock visual</div>
                <div className="col-span-1 text-center">Vendido</div>
                <div className="col-span-1 text-center">Reservado</div>
                <div className="col-span-1 text-center">Máx.</div>
              </div>

              <div className="divide-y divide-gray-50">
                {rows.map((row) => {
                  const maxStock = getMaxStock(row)
                  const free = Math.max(0, maxStock - row.soldStock - row.reservedStock)
                  const isEdited = edits[row.productId] !== undefined

                  return (
                    <div
                      key={row.productId}
                      className={cn(
                        'grid grid-cols-12 gap-4 px-5 py-4 items-center',
                        isEdited && 'bg-amber-50/50'
                      )}
                    >
                      {/* Producto */}
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.productImage}
                          alt={row.productName}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{row.productName}</p>
                          {!row.hasStock && (
                            <span className="text-xs text-yellow-600">Sin stock configurado</span>
                          )}
                        </div>
                      </div>

                      {/* Barra visual */}
                      <div className="col-span-5">
                        {maxStock > 0 ? (
                          <>
                            <p className="text-xs text-gray-400">
                              {row.soldStock} vend. / {row.reservedStock} res. / {free} lib. de {maxStock}
                            </p>
                            <MiniStockBar
                              sold={row.soldStock}
                              reserved={row.reservedStock}
                              free={free}
                              max={maxStock}
                            />
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">Sin stock configurado</p>
                        )}
                      </div>

                      {/* Vendido */}
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-medium text-green-600">{row.soldStock}</span>
                      </div>

                      {/* Reservado */}
                      <div className="col-span-1 text-center">
                        <span className="text-sm font-medium text-yellow-600">{row.reservedStock}</span>
                      </div>

                      {/* Máximo (editable) */}
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="number"
                          min={row.soldStock + row.reservedStock}
                          value={maxStock}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            if (!isNaN(val) && val >= 0) {
                              setEdits((prev) => ({ ...prev, [row.productId]: val }))
                            }
                          }}
                          className={cn(
                            'w-16 text-center text-sm font-semibold border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500',
                            isEdited ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                          )}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón guardar inferior */}
      {isDirty && (
        <div className="sticky bottom-4 flex justify-center pointer-events-none">
          <button
            onClick={handleSave}
            disabled={saving}
            className="pointer-events-auto flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-medium rounded-xl shadow-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar {Object.keys(edits).length} cambio{Object.keys(edits).length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
