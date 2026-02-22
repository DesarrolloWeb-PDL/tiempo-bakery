'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Save, RotateCcw, Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreventaConfig {
  enabled: boolean
  openingDay: number
  openingHour: number
  openingMinute: number
  closingDay: number
  closingHour: number
  closingMinute: number
}

const DAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

const DEFAULT_STATE: PreventaConfig = {
  enabled: true,
  openingDay: 3,
  openingHour: 18,
  openingMinute: 0,
  closingDay: 0,
  closingHour: 20,
  closingMinute: 0,
}

export default function AdminPreventaPage() {
  const [form, setForm] = useState<PreventaConfig>(DEFAULT_STATE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchConfig = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/preventa')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setForm(data)
      setDirty(false)
    } catch {
      setMessage({ type: 'error', text: 'No se pudo cargar la configuración de preventa' })
      setForm(DEFAULT_STATE)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const updateField = <K extends keyof PreventaConfig,>(key: K, value: PreventaConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/preventa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      setDirty(false)
      setMessage({ type: 'success', text: 'Configuración de preventa guardada' })
    } catch {
      setMessage({ type: 'error', text: 'No se pudo guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('¿Restablecer a valores por defecto?')) return

    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/preventa', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchConfig()
      setMessage({ type: 'success', text: 'Configuración restablecida a valores por defecto' })
    } catch {
      setMessage({ type: 'error', text: 'No se pudo restablecer la configuración' })
    } finally {
      setSaving(false)
    }
  }

  const timeOptions = Array.from({ length: 24 }, (_, h) => h)
  const minuteOptions = [0, 15, 30, 45]

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Días de preventa</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Define apertura y cierre semanal del periodo de pedidos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchConfig}
            disabled={loading || saving}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Restablecer
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !dirty}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </div>

      {message && (
        <div className={cn(
          'px-4 py-3 rounded-lg text-sm font-medium',
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        )}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => updateField('enabled', e.target.checked)}
          />
          Activar restricción de preventa
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Apertura</p>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={form.openingDay}
                onChange={(e) => updateField('openingDay', Number(e.target.value))}
                className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                {DAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  value={form.openingHour}
                  onChange={(e) => updateField('openingHour', Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm"
                >
                  {timeOptions.map((hour) => (
                    <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                  ))}
                </select>
                <select
                  value={form.openingMinute}
                  onChange={(e) => updateField('openingMinute', Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm"
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cierre</p>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={form.closingDay}
                onChange={(e) => updateField('closingDay', Number(e.target.value))}
                className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                {DAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  value={form.closingHour}
                  onChange={(e) => updateField('closingHour', Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm"
                >
                  {timeOptions.map((hour) => (
                    <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                  ))}
                </select>
                <select
                  value={form.closingMinute}
                  onChange={(e) => updateField('closingMinute', Number(e.target.value))}
                  className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm"
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-gray-400" />
          Horario actual: apertura {DAY_OPTIONS.find((d) => d.value === form.openingDay)?.label} {String(form.openingHour).padStart(2, '0')}:{String(form.openingMinute).padStart(2, '0')} · cierre {DAY_OPTIONS.find((d) => d.value === form.closingDay)?.label} {String(form.closingHour).padStart(2, '0')}:{String(form.closingMinute).padStart(2, '0')}
        </div>
      </div>
    </div>
  )
}
