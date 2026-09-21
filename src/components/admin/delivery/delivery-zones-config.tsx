'use client'

import React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { MapPinned, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import type { DeliveryZone as DeliveryZoneType } from '@/types/delivery'

export type DeliveryZone = DeliveryZoneType

export type ZoneDraft = {
  name: string
  neighborhoods: string
  shippingCost: number
  isActive: boolean
  order: number
}

export const EMPTY_ZONE_DRAFT: ZoneDraft = {
  name: '',
  neighborhoods: '',
  shippingCost: 0,
  isActive: true,
  order: 0,
}

type DeliveryZonesConfigProps = {
  zones: DeliveryZone[]
  zoneDraft: ZoneDraft
  setZoneDraft: Dispatch<SetStateAction<ZoneDraft>>
  editingZoneId: string | null
  loadingZones: boolean
  savingZone: boolean
  zonesMsg: string | null
  onRefreshZones: () => void
  onEditZone: (zone: DeliveryZone) => void
  onCancelEditZone: () => void
  onSaveZone: () => void
  onDeleteZone: (id: string) => void
}

export function DeliveryZonesConfig({
  zones,
  zoneDraft,
  setZoneDraft,
  editingZoneId,
  loadingZones,
  savingZone,
  zonesMsg,
  onRefreshZones,
  onEditZone,
  onCancelEditZone,
  onSaveZone,
  onDeleteZone,
}: DeliveryZonesConfigProps) {
  const updateZoneDraft = <K extends keyof ZoneDraft>(key: K, value: ZoneDraft[K]) => {
    setZoneDraft((prev) => ({ ...prev, [key]: value }))
  }

  const formatNeighborhoods = (items: string[]) => items.join(', ')

  const isSuccessMsg = zonesMsg &&
    (zonesMsg.includes('guardada') ||
      zonesMsg.includes('agregada') ||
      zonesMsg.includes('eliminada') ||
      zonesMsg.includes('desactivada'))

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
        <div>
          <h3 className="font-semibold text-white text-sm">Zonas de entrega</h3>
          <p className="text-xs text-gray-400 mt-1">Administrá las zonas, barrios y costos de envío.</p>
        </div>
        <button
          onClick={onRefreshZones}
          disabled={loadingZones || savingZone}
          className="px-3 py-2 bg-white text-gray-300 text-sm rounded-lg border border-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingZones ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="px-5 py-4 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nombre</label>
            <input
              type="text"
              value={zoneDraft.name}
              disabled={savingZone}
              onChange={(e) => updateZoneDraft('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
            />
          </div>
          <div>
            <label htmlFor="zone-shipping" className="block text-xs text-gray-400 mb-1">Costo de envío</label>
            <input
              id="zone-shipping"
              type="number"
              min={0}
              step="1"
              value={zoneDraft.shippingCost}
              disabled={savingZone}
              onChange={(e) => updateZoneDraft('shippingCost', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Barrios (separados por coma)</label>
            <input
              type="text"
              value={zoneDraft.neighborhoods}
              disabled={savingZone}
              onChange={(e) => updateZoneDraft('neighborhoods', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
              placeholder="Ej: Palermo, Belgrano, Villa Crespo"
            />
          </div>
          <div>
            <label htmlFor="zone-order" className="block text-xs text-gray-400 mb-1">Orden</label>
            <input
              id="zone-order"
              type="number"
              min={0}
              step="1"
              value={zoneDraft.order}
              disabled={savingZone}
              onChange={(e) => updateZoneDraft('order', Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={zoneDraft.isActive}
            disabled={savingZone}
            onChange={(e) => updateZoneDraft('isActive', e.target.checked)}
          />
          Zona activa
        </label>

        {zonesMsg && (
          <p className={`text-sm ${isSuccessMsg ? 'text-green-600' : 'text-red-600'}`}>
            {zonesMsg}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onSaveZone}
            disabled={savingZone}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white text-sm rounded-lg hover:bg-brand-gold-dark disabled:opacity-50"
          >
            {editingZoneId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{' '}
            {savingZone ? 'Guardando...' : editingZoneId ? 'Actualizar zona' : 'Agregar zona'}
          </button>
          {editingZoneId && (
            <button
              onClick={onCancelEditZone}
              disabled={savingZone}
              className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className="rounded-lg border border-gray-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <MapPinned className="w-4 h-4 text-brand-gold" /> {zone.name}
                  </p>
                  <p className="text-sm text-gray-300">{formatNeighborhoods(zone.neighborhoods)}</p>
                  <p className="text-xs text-gray-400">Envío: ${zone.shippingCost}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      zone.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {zone.isActive ? 'Activo' : 'Oculto'}
                  </span>
                  <button
                    onClick={() => onEditZone(zone)}
                    disabled={savingZone}
                    className="px-3 py-2 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600 disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDeleteZone(zone.id)}
                    disabled={savingZone}
                    className="px-3 py-2 bg-red-900/30 text-red-400 text-xs rounded-lg hover:bg-red-900/50 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!zones.length && !loadingZones && (
            <div className="rounded-lg border border-dashed border-gray-600 p-4 text-sm text-gray-400">
              Todavía no hay zonas de entrega cargadas.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
