'use client'

import React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { MapPin, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'

export type PickupPoint = {
  id: string
  name: string
  address: string
  city: string
  postalCode: string
  schedule: string
  instructions: string
  isActive: boolean
  order: number
}

export type PickupPointDraft = Omit<PickupPoint, 'id'>

export const EMPTY_PICKUP_POINT: PickupPointDraft = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  schedule: '',
  instructions: '',
  isActive: true,
  order: 0,
}

type PickupPointsConfigProps = {
  pickupPoints: PickupPoint[]
  pickupDraft: PickupPointDraft
  setPickupDraft: Dispatch<SetStateAction<PickupPointDraft>>
  editingPickupId: string | null
  loadingPickupPoints: boolean
  savingPickupPoint: boolean
  pickupPointsMsg: string | null
  onRefreshPickupPoints: () => void
  onEditPickupPoint: (point: PickupPoint) => void
  onCancelEditPickupPoint: () => void
  onSavePickupPoint: () => void
  onDeletePickupPoint: (id: string) => void
}

export function PickupPointsConfig({
  pickupPoints,
  pickupDraft,
  setPickupDraft,
  editingPickupId,
  loadingPickupPoints,
  savingPickupPoint,
  pickupPointsMsg,
  onRefreshPickupPoints,
  onEditPickupPoint,
  onCancelEditPickupPoint,
  onSavePickupPoint,
  onDeletePickupPoint,
}: PickupPointsConfigProps) {
  const updatePickupDraft = <K extends keyof PickupPointDraft>(key: K, value: PickupPointDraft[K]) => {
    setPickupDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
        <div>
          <h3 className="font-semibold text-white text-sm">Puntos de recogida</h3>
          <p className="text-xs text-gray-400 mt-1">Administrá los puntos visibles en checkout y su orden.</p>
        </div>
        <button
          onClick={onRefreshPickupPoints}
          disabled={loadingPickupPoints || savingPickupPoint}
          className="px-3 py-2 bg-white text-gray-300 text-sm rounded-lg border border-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingPickupPoints ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="px-5 py-4 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nombre</label>
            <input type="text" value={pickupDraft.name} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('name', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Horario</label>
            <input type="text" value={pickupDraft.schedule} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('schedule', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm" placeholder="Ej: Viernes 10:00 a 14:00" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Dirección</label>
            <input type="text" value={pickupDraft.address} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('address', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ciudad</label>
            <input type="text" value={pickupDraft.city} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('city', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Código postal</label>
            <input type="text" value={pickupDraft.postalCode} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('postalCode', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Orden</label>
            <input type="number" min={0} step="1" value={pickupDraft.order} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('order', Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Instrucciones</label>
            <textarea value={pickupDraft.instructions} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('instructions', e.target.value)} className="w-full min-h-24 px-3 py-2 rounded-lg border border-gray-700 text-sm" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={pickupDraft.isActive} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('isActive', e.target.checked)} />
          Punto activo en checkout
        </label>

        {pickupPointsMsg && <p className={`text-sm ${pickupPointsMsg.includes('guardado') || pickupPointsMsg.includes('agregado') || pickupPointsMsg.includes('eliminado') ? 'text-green-600' : 'text-red-600'}`}>{pickupPointsMsg}</p>}

        <div className="flex gap-2">
          <button onClick={onSavePickupPoint} disabled={savingPickupPoint} className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white text-sm rounded-lg hover:bg-brand-gold-dark disabled:opacity-50">
            {editingPickupId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {savingPickupPoint ? 'Guardando...' : editingPickupId ? 'Actualizar punto' : 'Agregar punto'}
          </button>
          {editingPickupId && (
            <button onClick={onCancelEditPickupPoint} disabled={savingPickupPoint} className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50">
              Cancelar edición
            </button>
          )}
        </div>

        <div className="space-y-3">
          {pickupPoints.map((point) => (
            <div key={point.id} className="rounded-lg border border-gray-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-gold" /> {point.name}
                  </p>
                  <p className="text-sm text-gray-300">{point.address}, {point.city} {point.postalCode}</p>
                  <p className="text-xs text-gray-400">{point.schedule}</p>
                  {point.instructions && <p className="text-xs text-gray-400">{point.instructions}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${point.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-700 text-gray-400'}`}>
                    {point.isActive ? 'Activo' : 'Oculto'}
                  </span>
                  <button onClick={() => onEditPickupPoint(point)} disabled={savingPickupPoint} className="px-3 py-2 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600 disabled:opacity-50">Editar</button>
                  <button onClick={() => onDeletePickupPoint(point.id)} disabled={savingPickupPoint} className="px-3 py-2 bg-red-900/30 text-red-400 text-xs rounded-lg hover:bg-red-900/50 disabled:opacity-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!pickupPoints.length && !loadingPickupPoints && (
            <div className="rounded-lg border border-dashed border-gray-600 p-4 text-sm text-gray-400">
              Todavía no hay puntos de recogida cargados.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
