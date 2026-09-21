'use client'

import React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

export type ShippingCosts = {
  pickupPoint: number
  localDelivery: number
  nationalCourier: number
}

type ShippingCostsConfigProps = {
  shippingCosts: ShippingCosts
  setShippingCosts: Dispatch<SetStateAction<ShippingCosts>>
  loadingShipping: boolean
  savingShipping: boolean
  shippingMsg: string | null
  onSaveShipping: () => void
  onResetShipping: () => void
}

export function ShippingCostsConfig({
  shippingCosts,
  setShippingCosts,
  loadingShipping,
  savingShipping,
  shippingMsg,
  onSaveShipping,
  onResetShipping,
}: ShippingCostsConfigProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-700">
        <Truck className="w-4 h-4 text-brand-gold" />
        <h3 className="font-semibold text-white text-sm">Costos de envío</h3>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Envío local (AR$)</label>
            <input
              type="number"
              min={0}
              step="1"
              value={shippingCosts.localDelivery}
              disabled={loadingShipping || savingShipping}
              onChange={(e) => setShippingCosts((prev) => ({ ...prev, localDelivery: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{formatCurrency(shippingCosts.localDelivery)}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Mensajería nacional (AR$)</label>
            <input
              type="number"
              min={0}
              step="1"
              value={shippingCosts.nationalCourier}
              disabled={loadingShipping || savingShipping}
              onChange={(e) => setShippingCosts((prev) => ({ ...prev, nationalCourier: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">{formatCurrency(shippingCosts.nationalCourier)}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400">Recogida en punto siempre se mantiene en <strong>gratis</strong>.</p>
        {shippingMsg && <p className="text-sm text-gray-300">{shippingMsg}</p>}

        <div className="flex gap-2">
          <button
            onClick={onSaveShipping}
            disabled={loadingShipping || savingShipping}
            className="px-4 py-2 bg-brand-gold text-white text-sm font-medium rounded-lg hover:bg-brand-gold-dark disabled:opacity-50"
          >
            {savingShipping ? 'Guardando...' : 'Guardar costos'}
          </button>
          <button
            onClick={onResetShipping}
            disabled={loadingShipping || savingShipping}
            className="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            Restablecer
          </button>
        </div>
      </div>
    </div>
  )
}
