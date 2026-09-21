'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DateTime } from 'luxon'
import { BarChart3, RefreshCw } from 'lucide-react'
import type { ReportResult } from '@/lib/delivery-reports'

const BAKERY_TIMEZONE = 'Europe/Madrid'

function getCurrentWeekRange(): { from: string; to: string } {
  const now = DateTime.now().setZone(BAKERY_TIMEZONE)
  const start = now.startOf('week')
  const end = now.endOf('week')
  return { from: start.toISODate() ?? '', to: end.toISODate() ?? '' }
}

type ReportResponse = ReportResult & {
  persons: { id: string; name: string }[]
  zones: { id: string; name: string }[]
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'READY', label: 'Listo' },
  { value: 'OUT_FOR_DELIVERY', label: 'En camino' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'DELIVERY_FAILED', label: 'Entrega fallida' },
]

function dateInputToUtcIso(value: string, endOfDay = false): string {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(
    Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0)
  )
  return date.toISOString()
}

function formatMinutes(minutes: number | null): string {
  if (minutes == null) return '—'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}

export function ReportsSection() {
  const weekRange = useMemo(() => getCurrentWeekRange(), [])
  const [data, setData] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState(weekRange.from)
  const [dateTo, setDateTo] = useState(weekRange.to)
  const [personId, setPersonId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [status, setStatus] = useState('')

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateInputToUtcIso(dateFrom))
    if (dateTo) params.set('dateTo', dateInputToUtcIso(dateTo, true))
    if (personId) params.set('personId', personId)
    if (zoneId) params.set('zoneId', zoneId)
    if (status) params.set('status', status)
    return params.toString()
  }, [dateFrom, dateTo, personId, zoneId, status])

  const fetchReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/delivery-reports?${query}`)
      if (!res.ok) throw new Error()
      const json = (await res.json()) as ReportResponse
      setData(json)
    } catch {
      setError('No se pudieron cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchReport()
  }, [query])

  const summary = data?.summary
  const isEmpty = !loading && summary?.total === 0

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
        <div>
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-gold" /> Reportes de entrega
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Métricas filtradas por fecha, repartidor, zona y estado.
          </p>
        </div>
        <button
          onClick={() => void fetchReport()}
          disabled={loading}
          aria-label="Actualizar reportes"
          className="px-3 py-2 bg-white text-gray-300 text-sm rounded-lg border border-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label htmlFor="report-date-from" className="block text-xs text-gray-400 mb-1">
              Desde
            </label>
            <input
              id="report-date-from"
              type="date"
              value={dateFrom}
              disabled={loading}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
            />
          </div>

          <div>
            <label htmlFor="report-date-to" className="block text-xs text-gray-400 mb-1">
              Hasta
            </label>
            <input
              id="report-date-to"
              type="date"
              value={dateTo}
              disabled={loading}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
            />
          </div>

          <div>
            <label htmlFor="report-person" className="block text-xs text-gray-400 mb-1">
              Repartidor
            </label>
            <select
              id="report-person"
              value={personId}
              disabled={loading}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
            >
              <option value="">Todos los repartidores</option>
              {data?.persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-zone" className="block text-xs text-gray-400 mb-1">
              Zona
            </label>
            <select
              id="report-zone"
              value={zoneId}
              disabled={loading}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
            >
              <option value="">Todas las zonas</option>
              {data?.zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-status" className="block text-xs text-gray-400 mb-1">
              Estado
            </label>
            <select
              id="report-status"
              value={status}
              disabled={loading}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && !data && (
          <p className="text-sm text-gray-400">Cargando reportes...</p>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isEmpty && !error && (
          <div className="rounded-lg border border-dashed border-gray-600 p-6 text-center">
            <p className="text-sm text-gray-400">No se encontraron entregas</p>
            <p className="text-xs text-gray-500 mt-1">
              Probá ajustando los filtros para ver más resultados.
            </p>
          </div>
        )}

        {summary && !isEmpty && !error && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard label="Total" value={String(summary.total)} />
              <MetricCard label="Entregados" value={String(summary.delivered)} />
              <MetricCard label="Fallidos" value={String(summary.failed)} />
              <MetricCard label="Tasa de éxito" value={`${summary.successRate}%`} />
              <MetricCard label="Tiempo promedio" value={formatMinutes(summary.avgMinutes)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BreakdownCard title="Por día" rows={data.perDay.map((d) => ({
                key: d.date,
                label: d.date,
                value: `${d.delivered} entregados · ${d.failed} fallidos`,
              }))} />
              <BreakdownCard title="Por repartidor" rows={data.byPerson.map((p) => ({
                key: p.personId,
                label: p.personName,
                value: `${p.delivered} / ${p.total}`,
              }))} />
              <BreakdownCard title="Por zona" rows={data.byZone.map((z) => ({
                key: z.zoneId,
                label: z.zoneName,
                value: `${z.delivered} / ${z.total}`,
              }))} />
              <BreakdownCard title="Por estado" rows={data.byStatus.map((s) => ({
                key: s.status,
                label: s.status,
                value: String(s.count),
              }))} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-semibold text-white mt-1">{value}</p>
    </div>
  )
}

function BreakdownCard({ title, rows }: { title: string; rows: { key: string; label: string; value: string }[] }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3">
      <h4 className="text-xs font-medium text-gray-300 mb-2">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500 italic">Sin datos</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{row.label}</span>
              <span className="text-white font-medium">{row.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
