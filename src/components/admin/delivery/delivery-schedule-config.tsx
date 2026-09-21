'use client'

import React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { CalendarDays, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import type { DeliveryScheduleWithAvailability } from '@/types/delivery'

const DAY_LABELS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

export type ScheduleDraft = {
  dayOfWeek: number
  startTime: string
  endTime: string
  maxOrders: number | ''
  cutoffDay: number | null
  cutoffTime: string
  isActive: boolean
}

export const EMPTY_SCHEDULE_DRAFT: ScheduleDraft = {
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '14:00',
  maxOrders: '',
  cutoffDay: null,
  cutoffTime: '',
  isActive: true,
}

type DeliveryScheduleConfigProps = {
  schedules: DeliveryScheduleWithAvailability[]
  scheduleDraft: ScheduleDraft
  setScheduleDraft: Dispatch<SetStateAction<ScheduleDraft>>
  editingScheduleId: string | null
  loadingSchedules: boolean
  savingSchedule: boolean
  schedulesMsg: string | null
  onRefreshSchedules: () => void
  onEditSchedule: (schedule: DeliveryScheduleWithAvailability) => void
  onCancelEditSchedule: () => void
  onSaveSchedule: () => void
  onDeleteSchedule: (id: string) => void
}

export function DeliveryScheduleConfig({
  schedules,
  scheduleDraft,
  setScheduleDraft,
  editingScheduleId,
  loadingSchedules,
  savingSchedule,
  schedulesMsg,
  onRefreshSchedules,
  onEditSchedule,
  onCancelEditSchedule,
  onSaveSchedule,
  onDeleteSchedule,
}: DeliveryScheduleConfigProps) {
  const updateDraft = <K extends keyof ScheduleDraft>(key: K, value: ScheduleDraft[K]) => {
    setScheduleDraft((prev) => ({ ...prev, [key]: value }))
  }

  const isSuccessMsg =
    schedulesMsg &&
    (schedulesMsg.includes('guardado') ||
      schedulesMsg.includes('agregado') ||
      schedulesMsg.includes('eliminado') ||
      schedulesMsg.includes('desactivado'))

  const formatWindow = (schedule: DeliveryScheduleWithAvailability) =>
    `${schedule.startTime} - ${schedule.endTime}`

  const formatCapacity = (schedule: DeliveryScheduleWithAvailability) => {
    if (schedule.maxOrders == null) return 'Sin límite'
    const current = schedule.currentOrders ?? 0
    return `${current} / ${schedule.maxOrders} pedidos`
  }

  const formatCutoff = (schedule: DeliveryScheduleWithAvailability) => {
    if (schedule.cutoffDay == null || !schedule.cutoffTime) return 'Sin corte'
    return `Corte: ${DAY_LABELS[schedule.cutoffDay]} ${schedule.cutoffTime}`
  }

  const activeSchedules = schedules.filter((s) => s.isActive)
  const schedulesByDay = new Map(activeSchedules.map((s) => [s.dayOfWeek, s]))

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
        <div>
          <h3 className="font-semibold text-white text-sm">Horarios de entrega</h3>
          <p className="text-xs text-gray-400 mt-1">
            Administrá los días, franjas horarias, capacidad y cierre de pedidos.
          </p>
        </div>
        <button
          onClick={onRefreshSchedules}
          disabled={loadingSchedules || savingSchedule}
          className="px-3 py-2 bg-white text-gray-300 text-sm rounded-lg border border-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingSchedules ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="schedule-day" className="block text-xs text-gray-400 mb-1">
              Día de la semana
            </label>
            <select
              id="schedule-day"
              value={scheduleDraft.dayOfWeek}
              disabled={savingSchedule}
              onChange={(e) => updateDraft('dayOfWeek', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
            >
              {DAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="schedule-max" className="block text-xs text-gray-400 mb-1">
              Máximo de pedidos
            </label>
            <input
              id="schedule-max"
              type="number"
              min={1}
              step="1"
              value={scheduleDraft.maxOrders}
              disabled={savingSchedule}
              onChange={(e) =>
                updateDraft('maxOrders', e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
              placeholder="Sin límite"
            />
          </div>

          <div>
            <label htmlFor="schedule-start" className="block text-xs text-gray-400 mb-1">
              Inicio
            </label>
            <input
              id="schedule-start"
              type="time"
              value={scheduleDraft.startTime}
              disabled={savingSchedule}
              onChange={(e) => updateDraft('startTime', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
            />
          </div>

          <div>
            <label htmlFor="schedule-end" className="block text-xs text-gray-400 mb-1">
              Fin
            </label>
            <input
              id="schedule-end"
              type="time"
              value={scheduleDraft.endTime}
              disabled={savingSchedule}
              onChange={(e) => updateDraft('endTime', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
            />
          </div>

          <div>
            <label htmlFor="schedule-cutoff-day" className="block text-xs text-gray-400 mb-1">
              Día de corte
            </label>
            <select
              id="schedule-cutoff-day"
              value={scheduleDraft.cutoffDay ?? ''}
              disabled={savingSchedule}
              onChange={(e) => {
                const value = e.target.value
                updateDraft('cutoffDay', value === '' ? null : Number(value))
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-900 text-white"
            >
              <option value="">Sin corte</option>
              {DAY_LABELS.map((label, index) => (
                <option key={`cutoff-${label}`} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="schedule-cutoff-time" className="block text-xs text-gray-400 mb-1">
              Hora de corte
            </label>
            <input
              id="schedule-cutoff-time"
              type="time"
              value={scheduleDraft.cutoffTime}
              disabled={savingSchedule || scheduleDraft.cutoffDay == null}
              onChange={(e) => updateDraft('cutoffTime', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={scheduleDraft.isActive}
            disabled={savingSchedule}
            onChange={(e) => updateDraft('isActive', e.target.checked)}
          />
          Slot activo
        </label>

        {schedulesMsg && (
          <p className={`text-sm ${isSuccessMsg ? 'text-green-600' : 'text-red-600'}`}>
            {schedulesMsg}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onSaveSchedule}
            disabled={savingSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white text-sm rounded-lg hover:bg-brand-gold-dark disabled:opacity-50"
          >
            {editingScheduleId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{' '}
            {savingSchedule ? 'Guardando...' : editingScheduleId ? 'Actualizar horario' : 'Agregar horario'}
          </button>
          {editingScheduleId && (
            <button
              onClick={onCancelEditSchedule}
              disabled={savingSchedule}
              className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="space-y-3">
          {DAY_LABELS.map((label, dayIndex) => {
            const schedule = schedulesByDay.get(dayIndex)
            return (
              <div
                key={dayIndex}
                className="rounded-lg border border-gray-700 p-4 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-brand-gold" /> {label}
                  </p>
                  {schedule ? (
                    <>
                      <p className="text-sm text-gray-300">{formatWindow(schedule)}</p>
                      <p className="text-xs text-gray-400">{formatCapacity(schedule)}</p>
                      <p className="text-xs text-gray-400">{formatCutoff(schedule)}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Sin horario configurado</p>
                  )}
                </div>
                {schedule && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        schedule.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {schedule.isActive ? 'Activo' : 'Oculto'}
                    </span>
                    <button
                      onClick={() => onEditSchedule(schedule)}
                      disabled={savingSchedule}
                      className="px-3 py-2 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDeleteSchedule(schedule.id)}
                      disabled={savingSchedule}
                      className="px-3 py-2 bg-red-900/30 text-red-400 text-xs rounded-lg hover:bg-red-900/50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {!activeSchedules.length && !loadingSchedules && (
            <div className="rounded-lg border border-dashed border-gray-600 p-4 text-sm text-gray-400">
              Todavía no hay horarios de entrega cargados.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
