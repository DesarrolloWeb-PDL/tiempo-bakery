'export const dynamic = "force-dynamic";'
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock3, Key, Layout, Loader2, LogOut, Mail, MapPin, Info, Palette, Plus, RefreshCw, RotateCcw, Save, Settings, Trash2, Truck } from 'lucide-react'
import Image from 'next/image';
import * as Tabs from '@radix-ui/react-tabs'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'
import { DEFAULT_SITE_CONTENT, type SiteContent } from '@/lib/site-content.shared'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)
}

type SiteContentEditorProps = {
  siteContent: SiteContent
  setSiteContent: React.Dispatch<React.SetStateAction<SiteContent>>
  loading: boolean
  saving: boolean
  message: string | null
  onSave: () => void
  onReset: () => void
}

type PreventaConfig = {
  enabled: boolean
  openingDay: number
  openingHour: number
  openingMinute: number
  closingDay: number
  closingHour: number
  closingMinute: number
}

type PickupPoint = {
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

type PickupPointDraft = Omit<PickupPoint, 'id'>

type DeliveryConfigAdminProps = {
  preventa: PreventaConfig
  setPreventa: React.Dispatch<React.SetStateAction<PreventaConfig>>
  loadingPreventa: boolean
  savingPreventa: boolean
  preventaMsg: string | null
  onRefreshPreventa: () => void
  onSavePreventa: () => void
  onResetPreventa: () => void
  shippingCosts: {
    pickupPoint: number
    localDelivery: number
    nationalCourier: number
  }
  setShippingCosts: React.Dispatch<React.SetStateAction<{
    pickupPoint: number
    localDelivery: number
    nationalCourier: number
  }>>
  loadingShipping: boolean
  savingShipping: boolean
  shippingMsg: string | null
  onSaveShipping: () => void
  onResetShipping: () => void
  pickupPoints: PickupPoint[]
  pickupDraft: PickupPointDraft
  setPickupDraft: React.Dispatch<React.SetStateAction<PickupPointDraft>>
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

const DAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
]

const DEFAULT_PREVENTA_CONFIG: PreventaConfig = {
  enabled: true,
  openingDay: 3,
  openingHour: 18,
  openingMinute: 0,
  closingDay: 0,
  closingHour: 20,
  closingMinute: 0,
}

const EMPTY_PICKUP_POINT: PickupPointDraft = {
  name: '',
  address: '',
  city: '',
  postalCode: '',
  schedule: '',
  instructions: '',
  isActive: true,
  order: 0,
}

function SiteContentActions({ loading, saving, message, onSave, onReset }: Omit<SiteContentEditorProps, 'siteContent' | 'setSiteContent'>) {
  return (
    <>
      {message && (
        <p className={`text-sm ${message.includes('actualizada') || message.includes('restablecida') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={loading || saving}
          className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar contenido'}
        </button>
        <button
          onClick={onReset}
          disabled={loading || saving}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Restablecer
        </button>
      </div>
    </>
  )
}

function FooterConfigAdmin({ siteContent, setSiteContent, loading, saving, message, onSave, onReset }: SiteContentEditorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Footer</h2>
        <p className="text-sm text-gray-500 mt-1">Editá el bloque descriptivo, horarios y datos de contacto del pie del sitio.</p>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Descripción</label>
        <textarea
          value={siteContent.footerDescription}
          disabled={loading || saving}
          onChange={(e) => setSiteContent((prev) => ({ ...prev, footerDescription: e.target.value }))}
          className="w-full min-h-24 px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Título del bloque de horario</label>
          <input
            type="text"
            value={siteContent.footerScheduleTitle}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, footerScheduleTitle: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Título del bloque de contacto</label>
          <input
            type="text"
            value={siteContent.footerContactTitle}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, footerContactTitle: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Horario visible</label>
          <input
            type="text"
            value={siteContent.footerScheduleText}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, footerScheduleText: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Texto de entregas</label>
          <input
            type="text"
            value={siteContent.footerDeliveryText}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, footerDeliveryText: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Nota legal o institucional del pie</label>
          <input
            type="text"
            value={siteContent.footerLegalNote}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, footerLegalNote: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
      </div>

      <SiteContentActions
        loading={loading}
        saving={saving}
        message={message}
        onSave={onSave}
        onReset={onReset}
      />
    </div>
  )
}

function NavConfigAdmin({ siteContent, setSiteContent, loading, saving, message, onSave, onReset }: SiteContentEditorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Navegación</h2>
        <p className="text-sm text-gray-500 mt-1">Definí los textos visibles en el menú principal del sitio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Link a productos</label>
          <input
            type="text"
            value={siteContent.navProductsLabel}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, navProductsLabel: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Link a sobre nosotros</label>
          <input
            type="text"
            value={siteContent.navAboutLabel}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, navAboutLabel: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Link a contacto</label>
          <input
            type="text"
            value={siteContent.navContactLabel}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, navContactLabel: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
      </div>

      <SiteContentActions
        loading={loading}
        saving={saving}
        message={message}
        onSave={onSave}
        onReset={onReset}
      />
    </div>
  )
}

function SobreNosotrosConfigAdmin({ siteContent, setSiteContent, loading, saving, message, onSave, onReset }: SiteContentEditorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Sobre Nosotros</h2>
        <p className="text-sm text-gray-500 mt-1">Configurá el contenido principal de la página institucional.</p>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Título</label>
        <input
          type="text"
          value={siteContent.aboutTitle}
          disabled={loading || saving}
          onChange={(e) => setSiteContent((prev) => ({ ...prev, aboutTitle: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Texto principal</label>
        <textarea
          value={siteContent.aboutBody}
          disabled={loading || saving}
          onChange={(e) => setSiteContent((prev) => ({ ...prev, aboutBody: e.target.value }))}
          className="w-full min-h-32 px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Segundo párrafo institucional</label>
        <textarea
          value={siteContent.aboutSecondaryBody}
          disabled={loading || saving}
          onChange={(e) => setSiteContent((prev) => ({ ...prev, aboutSecondaryBody: e.target.value }))}
          className="w-full min-h-28 px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
      </div>

      <SiteContentActions
        loading={loading}
        saving={saving}
        message={message}
        onSave={onSave}
        onReset={onReset}
      />
    </div>
  )
}

function ContactoConfigAdmin({ siteContent, setSiteContent, loading, saving, message, onSave, onReset }: SiteContentEditorProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Contacto</h2>
        <p className="text-sm text-gray-500 mt-1">Centralizá el texto introductorio y los datos que se muestran en la página y en el footer.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Título de la página</label>
          <input
            type="text"
            value={siteContent.contactTitle}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, contactTitle: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Texto introductorio</label>
          <textarea
            value={siteContent.contactIntro}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, contactIntro: e.target.value }))}
            className="w-full min-h-24 px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input
            type="email"
            value={siteContent.contactEmail}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, contactEmail: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Teléfono</label>
          <input
            type="text"
            value={siteContent.contactPhone}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, contactPhone: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">WhatsApp</label>
          <input
            type="text"
            value={siteContent.contactWhatsapp}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, contactWhatsapp: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Dirección u obrador</label>
          <input
            type="text"
            value={siteContent.contactAddress}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, contactAddress: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Texto de recogida</label>
          <textarea
            value={siteContent.deliveryPickupText}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, deliveryPickupText: e.target.value }))}
            className="w-full min-h-24 px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Texto de reparto local</label>
          <textarea
            value={siteContent.deliveryLocalText}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, deliveryLocalText: e.target.value }))}
            className="w-full min-h-24 px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Texto de mensajería urgente</label>
          <textarea
            value={siteContent.deliveryCourierText}
            disabled={loading || saving}
            onChange={(e) => setSiteContent((prev) => ({ ...prev, deliveryCourierText: e.target.value }))}
            className="w-full min-h-24 px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
      </div>

      <SiteContentActions
        loading={loading}
        saving={saving}
        message={message}
        onSave={onSave}
        onReset={onReset}
      />
    </div>
  )
}

function DeliveryConfigAdmin({
  preventa,
  setPreventa,
  loadingPreventa,
  savingPreventa,
  preventaMsg,
  onRefreshPreventa,
  onSavePreventa,
  onResetPreventa,
  shippingCosts,
  setShippingCosts,
  loadingShipping,
  savingShipping,
  shippingMsg,
  onSaveShipping,
  onResetShipping,
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
}: DeliveryConfigAdminProps) {
  const timeOptions = Array.from({ length: 24 }, (_, hour) => hour)
  const minuteOptions = [0, 15, 30, 45]

  const updatePreventa = <K extends keyof PreventaConfig>(key: K, value: PreventaConfig[K]) => {
    setPreventa((prev) => ({ ...prev, [key]: value }))
  }

  const updatePickupDraft = <K extends keyof PickupPointDraft>(key: K, value: PickupPointDraft[K]) => {
    setPickupDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Ventana semanal de preventa</h2>
            <p className="text-xs text-gray-500 mt-1">Configura cuándo abre y cierra el período de pedidos.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onRefreshPreventa}
              disabled={loadingPreventa || savingPreventa}
              className="px-3 py-2 bg-white text-gray-600 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingPreventa ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onResetPreventa}
              disabled={loadingPreventa || savingPreventa}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" /> Restablecer
            </button>
            <button
              onClick={onSavePreventa}
              disabled={loadingPreventa || savingPreventa}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {savingPreventa ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Apertura</p>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={preventa.openingDay}
                  onChange={(e) => updatePreventa('openingDay', Number(e.target.value))}
                  disabled={loadingPreventa || savingPreventa}
                  className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm"
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
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    {timeOptions.map((hour) => (
                      <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    value={preventa.openingMinute}
                    onChange={(e) => updatePreventa('openingMinute', Number(e.target.value))}
                    disabled={loadingPreventa || savingPreventa}
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
                  value={preventa.closingDay}
                  onChange={(e) => updatePreventa('closingDay', Number(e.target.value))}
                  disabled={loadingPreventa || savingPreventa}
                  className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm"
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
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    {timeOptions.map((hour) => (
                      <option key={hour} value={hour}>{String(hour).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    value={preventa.closingMinute}
                    onChange={(e) => updatePreventa('closingMinute', Number(e.target.value))}
                    disabled={loadingPreventa || savingPreventa}
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
            Apertura {DAY_OPTIONS.find((d) => d.value === preventa.openingDay)?.label} {String(preventa.openingHour).padStart(2, '0')}:{String(preventa.openingMinute).padStart(2, '0')} · cierre {DAY_OPTIONS.find((d) => d.value === preventa.closingDay)?.label} {String(preventa.closingHour).padStart(2, '0')}:{String(preventa.closingMinute).padStart(2, '0')}
          </div>

          {preventaMsg && <p className={`text-sm ${preventaMsg.includes('guardada') || preventaMsg.includes('restablecida') ? 'text-green-600' : 'text-red-600'}`}>{preventaMsg}</p>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Truck className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Costos de envío</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Envío local (AR$)</label>
              <input
                type="number"
                min={0}
                step="1"
                value={shippingCosts.localDelivery}
                disabled={loadingShipping || savingShipping}
                onChange={(e) => setShippingCosts((prev) => ({ ...prev, localDelivery: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(shippingCosts.localDelivery)}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mensajería nacional (AR$)</label>
              <input
                type="number"
                min={0}
                step="1"
                value={shippingCosts.nationalCourier}
                disabled={loadingShipping || savingShipping}
                onChange={(e) => setShippingCosts((prev) => ({ ...prev, nationalCourier: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(shippingCosts.nationalCourier)}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500">Recogida en punto siempre se mantiene en <strong>gratis</strong>.</p>
          {shippingMsg && <p className="text-sm text-gray-600">{shippingMsg}</p>}

          <div className="flex gap-2">
            <button
              onClick={onSaveShipping}
              disabled={loadingShipping || savingShipping}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {savingShipping ? 'Guardando...' : 'Guardar costos'}
            </button>
            <button
              onClick={onResetShipping}
              disabled={loadingShipping || savingShipping}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Restablecer
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Puntos de recogida</h3>
            <p className="text-xs text-gray-500 mt-1">Administrá los puntos visibles en checkout y su orden.</p>
          </div>
          <button
            onClick={onRefreshPickupPoints}
            disabled={loadingPickupPoints || savingPickupPoint}
            className="px-3 py-2 bg-white text-gray-600 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingPickupPoints ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre</label>
              <input type="text" value={pickupDraft.name} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('name', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Horario</label>
              <input type="text" value={pickupDraft.schedule} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('schedule', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Ej: Viernes 10:00 a 14:00" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dirección</label>
              <input type="text" value={pickupDraft.address} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('address', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ciudad</label>
              <input type="text" value={pickupDraft.city} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('city', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Código postal</label>
              <input type="text" value={pickupDraft.postalCode} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('postalCode', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Orden</label>
              <input type="number" min={0} step="1" value={pickupDraft.order} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('order', Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Instrucciones</label>
              <textarea value={pickupDraft.instructions} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('instructions', e.target.value)} className="w-full min-h-24 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={pickupDraft.isActive} disabled={savingPickupPoint} onChange={(e) => updatePickupDraft('isActive', e.target.checked)} />
            Punto activo en checkout
          </label>

          {pickupPointsMsg && <p className={`text-sm ${pickupPointsMsg.includes('guardado') || pickupPointsMsg.includes('agregado') || pickupPointsMsg.includes('eliminado') ? 'text-green-600' : 'text-red-600'}`}>{pickupPointsMsg}</p>}

          <div className="flex gap-2">
            <button onClick={onSavePickupPoint} disabled={savingPickupPoint} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {editingPickupId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {savingPickupPoint ? 'Guardando...' : editingPickupId ? 'Actualizar punto' : 'Agregar punto'}
            </button>
            {editingPickupId && (
              <button onClick={onCancelEditPickupPoint} disabled={savingPickupPoint} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50">
                Cancelar edición
              </button>
            )}
          </div>

          <div className="space-y-3">
            {pickupPoints.map((point) => (
              <div key={point.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600" /> {point.name}
                    </p>
                    <p className="text-sm text-gray-600">{point.address}, {point.city} {point.postalCode}</p>
                    <p className="text-xs text-gray-500">{point.schedule}</p>
                    {point.instructions && <p className="text-xs text-gray-500">{point.instructions}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${point.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {point.isActive ? 'Activo' : 'Oculto'}
                    </span>
                    <button onClick={() => onEditPickupPoint(point)} disabled={savingPickupPoint} className="px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 disabled:opacity-50">Editar</button>
                    <button onClick={() => onDeletePickupPoint(point.id)} disabled={savingPickupPoint} className="px-3 py-2 bg-red-50 text-red-700 text-xs rounded-lg hover:bg-red-100 disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!pickupPoints.length && !loadingPickupPoints && (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                Todavía no hay puntos de recogida cargados.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminConfigPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadingShipping, setLoadingShipping] = useState(true);
  const [savingShipping, setSavingShipping] = useState(false)
  const [shippingMsg, setShippingMsg] = useState<string | null>(null)
  const [shippingCosts, setShippingCosts] = useState({
    pickupPoint: 0,
    localDelivery: 3500,
    nationalCourier: 5950,
  })

  // Theme customization
  const [loadingTheme, setLoadingTheme] = useState(true)
  const [savingTheme, setSavingTheme] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [themeMsg, setThemeMsg] = useState<string | null>(null)
  const [theme, setTheme] = useState({
    appTitle: 'Tiempo Bakery',
    appSubtitle: 'Micropanadería artesanal por encargo semanal',
    logoUrl: '/img/espiga.png',
    primaryColor: '#d89a44',
    secondaryColor: '#2c2c2c',
    accentColor: '#f5f5f5',
  })
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [paymentSettings, setPaymentSettings] = useState<{
    defaultProvider: 'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'
    enabledProviders: Array<'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'>
    options: Array<{ value: 'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'; label: string; enabled: boolean; description?: string }>
    bankTransfer: {
      enabled: boolean
      bankName: string
      accountHolder: string
      alias: string
      cbu: string
      cuit: string
      notes: string
    }
  }>({
    defaultProvider: 'STRIPE',
    enabledProviders: [],
    options: [],
    bankTransfer: {
      enabled: false,
      bankName: '',
      accountHolder: '',
      alias: '',
      cbu: '',
      cuit: '',
      notes: '',
    },
  })
  const [loadingSiteContent, setLoadingSiteContent] = useState(true)
  const [savingSiteContent, setSavingSiteContent] = useState(false)
  const [siteContentMsg, setSiteContentMsg] = useState<string | null>(null)
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT)
  const [loadingPreventa, setLoadingPreventa] = useState(true)
  const [savingPreventa, setSavingPreventa] = useState(false)
  const [preventaMsg, setPreventaMsg] = useState<string | null>(null)
  const [preventa, setPreventa] = useState<PreventaConfig>(DEFAULT_PREVENTA_CONFIG)
  const [loadingPickupPoints, setLoadingPickupPoints] = useState(true)
  const [savingPickupPoint, setSavingPickupPoint] = useState(false)
  const [pickupPointsMsg, setPickupPointsMsg] = useState<string | null>(null)
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
  const [pickupDraft, setPickupDraft] = useState<PickupPointDraft>(EMPTY_PICKUP_POINT)
  const [editingPickupId, setEditingPickupId] = useState<string | null>(null)

  const fetchShippingCosts = async () => {
    setLoadingShipping(true)
    setShippingMsg(null)
    try {
      const res = await fetch('/api/admin/envios')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setShippingCosts({
        pickupPoint: Number(data.pickupPoint ?? 0),
        localDelivery: Number(data.localDelivery ?? 3500),
        nationalCourier: Number(data.nationalCourier ?? 5950),
      })
    } catch {
      setShippingMsg('No se pudieron cargar los costos de envío')
    } finally {
      setLoadingShipping(false)
    }
  }

  const fetchThemeConfig = async () => {
    setLoadingTheme(true)
    setThemeMsg(null)
    try {
      const res = await fetch('/api/admin/tema')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTheme(data)
    } catch {
      setThemeMsg('No se pudo cargar la configuración del tema')
    } finally {
      setLoadingTheme(false)
    }
  }

  const fetchPaymentSettings = async () => {
    setLoadingPayments(true)
    try {
      const res = await fetch('/api/admin/pagos')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPaymentSettings(data)
    } catch {
      // noop: la página dedicada de pagos maneja mensajes detallados
    } finally {
      setLoadingPayments(false)
    }
  }

  const fetchSiteContent = async () => {
    setLoadingSiteContent(true)
    setSiteContentMsg(null)
    try {
      const res = await fetch('/api/admin/site-content')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSiteContent(data)
    } catch {
      setSiteContentMsg('No se pudo cargar la configuración del contenido del sitio')
    } finally {
      setLoadingSiteContent(false)
    }
  }

  const fetchPreventa = async () => {
    setLoadingPreventa(true)
    setPreventaMsg(null)
    try {
      const res = await fetch('/api/admin/preventa')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPreventa(data)
    } catch {
      setPreventaMsg('No se pudo cargar la configuración de preventa')
      setPreventa(DEFAULT_PREVENTA_CONFIG)
    } finally {
      setLoadingPreventa(false)
    }
  }

  const fetchPickupPoints = async () => {
    setLoadingPickupPoints(true)
    setPickupPointsMsg(null)
    try {
      const res = await fetch('/api/admin/puntos-recogida')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPickupPoints(data.puntos ?? [])
    } catch {
      setPickupPointsMsg('No se pudieron cargar los puntos de recogida')
    } finally {
      setLoadingPickupPoints(false)
    }
  }

  useEffect(() => {
    void fetchShippingCosts()
    void fetchThemeConfig()
    void fetchPaymentSettings()
    void fetchSiteContent()
    void fetchPreventa()
    void fetchPickupPoints()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  const handleSaveShipping = async () => {
    setSavingShipping(true)
    setShippingMsg(null)
    try {
      const res = await fetch('/api/admin/envios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localDelivery: Math.max(0, shippingCosts.localDelivery),
          nationalCourier: Math.max(0, shippingCosts.nationalCourier),
        }),
      })
      if (!res.ok) throw new Error()
      setShippingMsg('Costos de envío actualizados')
    } catch {
      setShippingMsg('No se pudieron guardar los costos de envío')
    } finally {
      setSavingShipping(false)
    }
  }

  const handleResetShipping = async () => {
    setSavingShipping(true)
    setShippingMsg(null)
    try {
      const res = await fetch('/api/admin/envios', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchShippingCosts()
      setShippingMsg('Costos restablecidos a valores por defecto')
    } catch {
      setShippingMsg('No se pudieron restablecer los costos')
    } finally {
      setSavingShipping(false)
    }
  }

  const handleSaveTheme = async () => {
    setSavingTheme(true)
    setThemeMsg(null)
    try {
      console.log('[Save Theme] Enviando:', theme)
      const res = await fetch('/api/admin/tema', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      })
      const data = await res.json()
      console.log('[Save Theme] Respuesta:', { status: res.status, data })
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`)
      }
      setThemeMsg('Configuración actualizada correctamente')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'No se pudo guardar la configuración'
      console.error('[Save Theme] Error:', errorMsg)
      setThemeMsg(`No se pudo guardar la configuración: ${errorMsg}`)
    } finally {
      setSavingTheme(false)
    }
  }

  const handleResetTheme = async () => {
    setSavingTheme(true)
    setThemeMsg(null)
    try {
      const res = await fetch('/api/admin/tema', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchThemeConfig()
      setThemeMsg('Tema restablecido a valores por defecto')
    } catch {
      setThemeMsg('No se pudo restablecer el tema')
    } finally {
      setSavingTheme(false)
    }
  }

  const handleSaveSiteContent = async () => {
    setSavingSiteContent(true)
    setSiteContentMsg(null)
    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteContent),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el contenido')
      setSiteContentMsg('Configuración del contenido actualizada')
      await fetchSiteContent()
    } catch (error) {
      setSiteContentMsg(error instanceof Error ? error.message : 'No se pudo guardar el contenido')
    } finally {
      setSavingSiteContent(false)
    }
  }

  const handleResetSiteContent = async () => {
    setSavingSiteContent(true)
    setSiteContentMsg(null)
    try {
      const res = await fetch('/api/admin/site-content', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo restablecer el contenido')
      await fetchSiteContent()
      setSiteContentMsg('Configuración del contenido restablecida')
    } catch (error) {
      setSiteContentMsg(error instanceof Error ? error.message : 'No se pudo restablecer el contenido')
    } finally {
      setSavingSiteContent(false)
    }
  }

  const handleSavePreventa = async () => {
    setSavingPreventa(true)
    setPreventaMsg(null)
    try {
      const res = await fetch('/api/admin/preventa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preventa),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la configuración')
      setPreventaMsg('Configuración de preventa guardada')
    } catch (error) {
      setPreventaMsg(error instanceof Error ? error.message : 'No se pudo guardar la configuración de preventa')
    } finally {
      setSavingPreventa(false)
    }
  }

  const handleResetPreventa = async () => {
    setSavingPreventa(true)
    setPreventaMsg(null)
    try {
      const res = await fetch('/api/admin/preventa', { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo restablecer la configuración')
      await fetchPreventa()
      setPreventaMsg('Configuración de preventa restablecida')
    } catch (error) {
      setPreventaMsg(error instanceof Error ? error.message : 'No se pudo restablecer la configuración de preventa')
    } finally {
      setSavingPreventa(false)
    }
  }

  const handleEditPickupPoint = (point: PickupPoint) => {
    const { id: _id, ...draft } = point
    setEditingPickupId(point.id)
    setPickupDraft({ ...draft, instructions: point.instructions ?? '' })
    setPickupPointsMsg(null)
  }

  const handleCancelEditPickupPoint = () => {
    setEditingPickupId(null)
    setPickupDraft(EMPTY_PICKUP_POINT)
    setPickupPointsMsg(null)
  }

  const handleSavePickupPoint = async () => {
    if (!pickupDraft.name.trim() || !pickupDraft.address.trim() || !pickupDraft.city.trim() || !pickupDraft.schedule.trim()) {
      setPickupPointsMsg('Completá al menos nombre, dirección, ciudad y horario del punto')
      return
    }

    setSavingPickupPoint(true)
    setPickupPointsMsg(null)
    try {
      const payload = editingPickupId ? { id: editingPickupId, ...pickupDraft } : pickupDraft
      const res = await fetch('/api/admin/puntos-recogida', {
        method: editingPickupId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el punto de recogida')
      await fetchPickupPoints()
      setEditingPickupId(null)
      setPickupDraft(EMPTY_PICKUP_POINT)
      setPickupPointsMsg(editingPickupId ? 'Punto de recogida guardado' : 'Punto de recogida agregado')
    } catch (error) {
      setPickupPointsMsg(error instanceof Error ? error.message : 'No se pudo guardar el punto de recogida')
    } finally {
      setSavingPickupPoint(false)
    }
  }

  const handleDeletePickupPoint = async (id: string) => {
    setSavingPickupPoint(true)
    setPickupPointsMsg(null)
    try {
      const res = await fetch('/api/admin/puntos-recogida', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el punto de recogida')
      await fetchPickupPoints()
      if (editingPickupId === id) {
        setEditingPickupId(null)
        setPickupDraft(EMPTY_PICKUP_POINT)
      }
      setPickupPointsMsg('Punto de recogida eliminado')
    } catch (error) {
      setPickupPointsMsg(error instanceof Error ? error.message : 'No se pudo eliminar el punto de recogida')
    } finally {
      setSavingPickupPoint(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setThemeMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')

      const res = await fetch('/api/admin/uploads/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar el logo')

      setTheme({ ...theme, logoUrl: data.url })
      setThemeMsg('Logo cargado correctamente')
      
      // Limpiar el input - usar getElementById en lugar de e.currentTarget
      const logoInput = document.getElementById('logo-upload') as HTMLInputElement
      if (logoInput) {
        logoInput.value = ''
      }
    } catch (error) {
      setThemeMsg(`Error: ${error instanceof Error ? error.message : 'No se pudo cargar el logo'}`)
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6 text-amber-600" /> Configuración
      </h1>
      <Tabs.Root defaultValue="entrega" className="w-full">
        <Tabs.List className="flex gap-2 border-b mb-6">
          <Tabs.Trigger value="entrega" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <Truck className="w-4 h-4" /> Días y lugares de entrega
          </Tabs.Trigger>
          <Tabs.Trigger value="footer" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <Layout className="w-4 h-4" /> Footer
          </Tabs.Trigger>
          <Tabs.Trigger value="nav" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <Palette className="w-4 h-4" /> Navegación
          </Tabs.Trigger>
          <Tabs.Trigger value="sobre" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <Info className="w-4 h-4" /> Sobre Nosotros
          </Tabs.Trigger>
          <Tabs.Trigger value="contacto" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <Mail className="w-4 h-4" /> Contacto
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="entrega">
          <DeliveryConfigAdmin
            preventa={preventa}
            setPreventa={setPreventa}
            loadingPreventa={loadingPreventa}
            savingPreventa={savingPreventa}
            preventaMsg={preventaMsg}
            onRefreshPreventa={fetchPreventa}
            onSavePreventa={handleSavePreventa}
            onResetPreventa={handleResetPreventa}
            shippingCosts={shippingCosts}
            setShippingCosts={setShippingCosts}
            loadingShipping={loadingShipping}
            savingShipping={savingShipping}
            shippingMsg={shippingMsg}
            onSaveShipping={handleSaveShipping}
            onResetShipping={handleResetShipping}
            pickupPoints={pickupPoints}
            pickupDraft={pickupDraft}
            setPickupDraft={setPickupDraft}
            editingPickupId={editingPickupId}
            loadingPickupPoints={loadingPickupPoints}
            savingPickupPoint={savingPickupPoint}
            pickupPointsMsg={pickupPointsMsg}
            onRefreshPickupPoints={fetchPickupPoints}
            onEditPickupPoint={handleEditPickupPoint}
            onCancelEditPickupPoint={handleCancelEditPickupPoint}
            onSavePickupPoint={handleSavePickupPoint}
            onDeletePickupPoint={handleDeletePickupPoint}
          />
        </Tabs.Content>
        <Tabs.Content value="footer">
          <FooterConfigAdmin
            siteContent={siteContent}
            setSiteContent={setSiteContent}
            loading={loadingSiteContent}
            saving={savingSiteContent}
            message={siteContentMsg}
            onSave={handleSaveSiteContent}
            onReset={handleResetSiteContent}
          />
        </Tabs.Content>
        <Tabs.Content value="nav">
          <NavConfigAdmin
            siteContent={siteContent}
            setSiteContent={setSiteContent}
            loading={loadingSiteContent}
            saving={savingSiteContent}
            message={siteContentMsg}
            onSave={handleSaveSiteContent}
            onReset={handleResetSiteContent}
          />
        </Tabs.Content>
        <Tabs.Content value="sobre">
          <SobreNosotrosConfigAdmin
            siteContent={siteContent}
            setSiteContent={setSiteContent}
            loading={loadingSiteContent}
            saving={savingSiteContent}
            message={siteContentMsg}
            onSave={handleSaveSiteContent}
            onReset={handleResetSiteContent}
          />
        </Tabs.Content>
        <Tabs.Content value="contacto">
          <ContactoConfigAdmin
            siteContent={siteContent}
            setSiteContent={setSiteContent}
            loading={loadingSiteContent}
            saving={savingSiteContent}
            message={siteContentMsg}
            onSave={handleSaveSiteContent}
            onReset={handleResetSiteContent}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* Seguridad */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-10">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Key className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Seguridad</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm text-gray-700 font-medium mb-1">Contraseña de administrador</p>
            <p className="text-sm text-gray-500">
              Configura la variable de entorno{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">ADMIN_PASSWORD</code>{' '}
              y <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">JWT_SECRET</code>{' '}
              en tu archivo <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>
            </p>
            <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg mt-2">
              ⚠️ La contraseña por defecto <strong>admin123</strong> solo aplica en desarrollo local.
              En despliegue necesitás definir <code>ADMIN_PASSWORD</code> y <code>JWT_SECRET</code>.
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Info del sistema */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-6">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Settings className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Información del sistema</h3>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {[
            { label: 'Versión', value: '1.0.0' },
            { label: 'Stack', value: 'Next.js 14 + Prisma' },
            { label: 'Base de datos', value: 'SQLite (dev) / PostgreSQL (prod)' },
            { label: 'Pagos', value: paymentSettings.enabledProviders.length ? paymentSettings.enabledProviders.join(' + ') : 'Sin configurar' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-6">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Settings className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Pagos</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            La configuración de métodos de pago ahora vive en una pantalla dedicada para mantener el panel más ordenado.
          </p>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">Estado actual</p>
              <p className="text-xs text-gray-500">
                {loadingPayments
                  ? 'Cargando proveedores...'
                  : paymentSettings.enabledProviders.length
                    ? paymentSettings.enabledProviders.join(' + ')
                    : 'Sin proveedores activos'}
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/pagos')}
              className="px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
            >
              Ir a Pagos
            </button>
          </div>
        </div>
      </div>

      {/* Personalización de la app */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Palette className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Personalización de la app</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Título de la tienda</label>
            <input
              type="text"
              value={theme.appTitle}
              disabled={loadingTheme || savingTheme}
              onChange={(e) => setTheme({ ...theme, appTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="Ej: Tiempo Bakery"
            />
          </div>

          {/* Subtítulo */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subtítulo/Lema</label>
            <input
              type="text"
              value={theme.appSubtitle}
              disabled={loadingTheme || savingTheme}
              onChange={(e) => setTheme({ ...theme, appSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="Ej: Micropanadería artesanal por encargo semanal"
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Logo de la tienda</label>
            <div className="space-y-2">
              {/* Cargar archivo */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="logo-upload"
                  className={`flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors ${
                    uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingLogo ? 'Cargando...' : 'Seleccionar imagen'}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  disabled={loadingTheme || savingTheme || uploadingLogo}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* O URL manual */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">O ingresa URL manualmente:</label>
                <input
                  type="url"
                  value={theme.logoUrl}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  placeholder="Ej: /img/logo.png"
                />
              </div>
            </div>

            {/* Preview */}
            {theme.logoUrl && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                <Image
                  src={normalizePublicAssetUrl(theme.logoUrl) || '/img/espiga.png'}
                  alt="Logo preview"
                  width={64}
                  height={64}
                  className="h-16 object-contain"
                  priority
                />
              </div>
            )}
          </div>

          {/* Colores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color primario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.primaryColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.primaryColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Color secundario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.secondaryColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.secondaryColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Color de acentos</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.accentColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.accentColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {themeMsg && (
            <p className={`text-sm ${typeof themeMsg === 'string' && themeMsg?.includes('correctamente') ? 'text-green-600' : 'text-red-600'}`}>
              {themeMsg}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSaveTheme}
              disabled={loadingTheme || savingTheme}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {savingTheme ? 'Guardando...' : 'Guardar personalización'}
            </button>
            <button
              onClick={handleResetTheme}
              disabled={loadingTheme || savingTheme}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Restablecer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
