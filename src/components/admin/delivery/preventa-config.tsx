'use client'

import React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Clock3, RefreshCw, RotateCcw, Save } from 'lucide-react'

export type PreventaConfig = {
  enabled: boolean
  openingDay: number
  openingHour: number
  openingMinute: number
  closingDay: number
  closingHour: number
  closingMinute: number
}

export const DAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

export const DEFAULT_PREVENTA_CONFIG: PreventaConfig = {
  enabled: true,
  openingDay: 3,
  openingHour: 18,
  openingMinute: 0,
  closingDay: 0,
  closingHour: 20,
  closingMinute: 0,
}

type PreventaConfigProps = {
  preventa: PreventaConfig
  setPreventa: Dispatch<SetStateAction<PreventaConfig>>
  loadingPreventa: boolean
  savingPreventa: boolean
  preventaMsg: string | null
  onRefreshPreventa: () => void
  onSavePreventa: () => void
  onResetPreventa: () => void
}

export function PreventaConfig({
  preventa,
  setPreventa,
  loadingPreventa,
  savingPreventa,
  preventaMsg,
  onRefreshPreventa,
  onSavePreventa,
  onResetPreventa,
}: PreventaConfigProps) {
  const timeOptions = Array.from({ length: 24 }, (_, hour) => hour)
  const minuteOptions = [0, 15, 30, 45]

  const updatePreventa = <K extends keyof PreventaConfig>(key: K, value: PreventaConfig[K]) => {
    setPreventa((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
        <div>
          <h2 className="font-semibold text-white text-sm">Ventana semanal de preventa</h2>
          <p className="text-xs text-gray-400 mt-1">Configura cuándo abre y cierra el período de pedidos.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefreshPreventa}
            disabled={loadingPreventa || savingPreventa}
            className="px-3 py-2 bg-white text-gray-300 text-sm rounded-lg border border-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingPreventa ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onResetPreventa}
            disabled={loadingPreventa || savingPreventa}
            className="flex items-center gap-2 px-3 py-2 bg-red-900/30 text-red-400 text-sm rounded-lg border border-red-800 hover:bg-red-900/50 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" /> Restablecer
          </button>
          <button
            onClick={onSavePreventa}
            disabled={loadingPreventa || savingPreventa}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white text-sm rounded-lg hover:bg-brand-gold-dark disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {savingPreventa ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <input
            type="checkbox"
            checked={preventa.enabled}
            onChange={(e) => updatePreventa('enabled', e.target.checked)}
            disabled={loadingPreventa || savingPreventa}
          />
          Activar restricción de preventa
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Apertura</p>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={preventa.openingDay}
                onChange={(e) => updatePreventa('openingDay', Number(e.target.value))}
                disabled={loadingPreventa || savingPreventa}
                className="col-span-2 px-3 py-2 rounded-lg border border-gray-700 text-sm"
              >
                {DAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  value={preventa.openingHour}
                  onChange={(e) => updatePreventa('openingHour', Number(e.target.value))}
                  disabled={loadingPreventa || savingPreventa}
                  className="w-full px-2 py-2 rounded-lg border border-gray-700 text-sm"
                >
                  {timeOptions.map((hour) => (
                    <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                  ))}
                </select>
                <select
                  value={preventa.openingMinute}
                  onChange={(e) => updatePreventa('openingMinute', Number(e.target.value))}
                  disabled={loadingPreventa || savingPreventa}
                  className="w-full px-2 py-2 rounded-lg border border-gray-700 text-sm"
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Cierre</p>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={preventa.closingDay}
                onChange={(e) => updatePreventa('closingDay', Number(e.target.value))}
                disabled={loadingPreventa || savingPreventa}
                className="col-span-2 px-3 py-2 rounded-lg border border-gray-700 text-sm"
              >
                {DAY_OPTIONS.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  value={preventa.closingHour}
                  onChange={(e) => updatePreventa('closingHour', Number(e.target.value))}
                  disabled={loadingPreventa || savingPreventa}
                  className="w-full px-2 py-2 rounded-lg border border-gray-700 text-sm"
                >
                  {timeOptions.map((hour) => (
                    <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                  ))}
                </select>
                <select
                  value={preventa.closingMinute}
                  onChange={(e) => updatePreventa('closingMinute', Number(e.target.value))}
                  disabled={loadingPreventa || savingPreventa}
                  className="w-full px-2 py-2 rounded-lg border border-gray-700 text-sm"
                >
                  {minuteOptions.map((minute) => (
                    <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-400 bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-gray-400" />
          Apertura {DAY_OPTIONS.find((d) => d.value === preventa.openingDay)?.label} {String(preventa.openingHour).padStart(2, '0')}:{String(preventa.openingMinute).padStart(2, '0')} · cierre {DAY_OPTIONS.find((d) => d.value === preventa.closingDay)?.label} {String(preventa.closingHour).padStart(2, '0')}:{String(preventa.closingMinute).padStart(2, '0')}
        </div>

        {preventaMsg && <p className={`text-sm ${preventaMsg.includes('guardada') || preventaMsg.includes('restablecida') ? 'text-green-600' : 'text-red-600'}`}>{preventaMsg}</p>}
      </div>
    </div>
  )
}
