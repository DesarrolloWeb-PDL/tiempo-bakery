'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Eye, EyeOff, Save } from 'lucide-react'

type PaymentSettingsState = {
  defaultProvider: 'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'
  enabledProviders: Array<'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'>
  stripeSecretKey: string
  mercadopagoAccessToken: string
  options: Array<{
    value: 'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'
    label: string
    enabled: boolean
    description?: string
  }>
  bankTransfer: {
    enabled: boolean
    bankName: string
    accountHolder: string
    alias: string
    cbu: string
    cuit: string
    notes: string
  }
}

const DEFAULT_PAYMENT_SETTINGS: PaymentSettingsState = {
  defaultProvider: 'STRIPE',
  enabledProviders: [],
  stripeSecretKey: '',
  mercadopagoAccessToken: '',
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
}

export default function AdminPagosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showKeys, setShowKeys] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsState>(DEFAULT_PAYMENT_SETTINGS)

  const bankTransferConfigured =
    paymentSettings.bankTransfer.enabled &&
    Boolean(
      paymentSettings.bankTransfer.bankName.trim() ||
      paymentSettings.bankTransfer.accountHolder.trim() ||
      paymentSettings.bankTransfer.alias.trim() ||
      paymentSettings.bankTransfer.cbu.trim()
    )

  const stripeKeyEntered = paymentSettings.stripeSecretKey.trim().length > 0
  const mpKeyEntered = paymentSettings.mercadopagoAccessToken.trim().length > 0

  const keyProviders = useMemo(() => {
    const providers: Array<'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'> = []
    if (stripeKeyEntered) providers.push('STRIPE')
    if (mpKeyEntered) providers.push('MERCADO_PAGO')
    return providers
  }, [stripeKeyEntered, mpKeyEntered])

  const envProviders = useMemo(
    () =>
      paymentSettings.enabledProviders.filter(
        (p) => p !== 'BANK_TRANSFER' && !keyProviders.includes(p)
      ),
    [paymentSettings.enabledProviders, keyProviders]
  )

  const effectiveProviders = useMemo(
    () =>
      Array.from(
        new Set([
          ...envProviders,
          ...keyProviders,
          ...(bankTransferConfigured ? ['BANK_TRANSFER' as const] : []),
        ])
      ) as Array<'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'>,
    [envProviders, keyProviders, bankTransferConfigured]
  )

  const fetchPaymentSettings = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/pagos')
      if (!res.ok) throw new Error('No se pudo cargar la configuración de pagos')
      const data = await res.json()
      setPaymentSettings({
        ...DEFAULT_PAYMENT_SETTINGS,
        ...data,
        bankTransfer: {
          ...DEFAULT_PAYMENT_SETTINGS.bankTransfer,
          ...(data.bankTransfer ?? {}),
        },
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar la configuración de pagos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPaymentSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/pagos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la configuración de pagos')

      setMessage(`Proveedor por defecto actualizado a ${data.label}`)
      await fetchPaymentSettings()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la configuración de pagos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-amber-600" /> Pagos
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configurá métodos de pago para checkout y definí el proveedor por defecto.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Métodos disponibles</h2>
        </div>

        <div className="px-5 py-4 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Cargando configuración...</p>
          ) : (
            <>
              <div className="space-y-2">
                {paymentSettings.options.map((option) => {
                  const available =
                    option.value === 'BANK_TRANSFER'
                      ? bankTransferConfigured
                      : option.value === 'STRIPE'
                        ? option.enabled || stripeKeyEntered
                        : option.value === 'MERCADO_PAGO'
                          ? option.enabled || mpKeyEntered
                          : option.enabled

                  const source =
                    option.value === 'BANK_TRANSFER'
                      ? available
                        ? 'Configurado en este panel'
                        : 'Completá los datos para habilitarlo'
                      : option.enabled
                        ? 'Configurado en variables de entorno'
                        : stripeKeyEntered || mpKeyEntered
                          ? 'Configurado con credencial guardada'
                          : 'Falta credencial (completá abajo)'

                  return (
                    <div key={option.value} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{option.label}</p>
                        <p className="text-xs text-gray-500">{source}</p>
                        {option.description && <p className="text-[11px] text-gray-400 mt-1">{option.description}</p>}
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {available ? 'Disponible' : 'Inactivo'}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Credenciales de API</p>
                  <button
                    type="button"
                    onClick={() => setShowKeys(!showKeys)}
                    className="text-xs text-amber-600 hover:text-amber-700 inline-flex items-center gap-1"
                  >
                    {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showKeys ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Stripe Secret Key</label>
                    <input
                      type={showKeys ? 'text' : 'password'}
                      value={paymentSettings.stripeSecretKey}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          stripeSecretKey: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white font-mono"
                      placeholder="sk_live_..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mercado Pago Access Token</label>
                    <input
                      type={showKeys ? 'text' : 'password'}
                      value={paymentSettings.mercadopagoAccessToken}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          mercadopagoAccessToken: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white font-mono"
                      placeholder="APP_USR-..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Proveedor por defecto en checkout</label>
                <select
                  value={paymentSettings.defaultProvider}
                  disabled={loading || saving}
                  onChange={(e) =>
                    setPaymentSettings((prev) => ({
                      ...prev,
                      defaultProvider: e.target.value as 'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER',
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  {paymentSettings.options.map((option) => {
                    const available =
                      option.value === 'BANK_TRANSFER'
                        ? bankTransferConfigured
                        : option.value === 'STRIPE'
                          ? option.enabled || stripeKeyEntered
                          : option.value === 'MERCADO_PAGO'
                            ? option.enabled || mpKeyEntered
                            : option.enabled
                    return (
                      <option key={option.value} value={option.value} disabled={!available}>
                        {option.label}{!available ? ' (no disponible)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Transferencia bancaria</p>
                    <p className="text-xs text-gray-500">Se muestra como opción manual en checkout y confirmación.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 shrink-0">
                    <input
                      type="checkbox"
                      checked={paymentSettings.bankTransfer.enabled}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: {
                            ...prev.bankTransfer,
                            enabled: e.target.checked,
                          },
                        }))
                      }
                    />
                    Habilitada
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Banco</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.bankName}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, bankName: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      placeholder="Banco Nación, Galicia, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Titular</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.accountHolder}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, accountHolder: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      placeholder="Nombre del titular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Alias</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.alias}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, alias: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      placeholder="alias.tiempo.bakery"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">CBU</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.cbu}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, cbu: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      placeholder="22 dígitos"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">CUIT</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.cuit}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, cuit: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      placeholder="20-12345678-9"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Notas / instrucciones</label>
                    <textarea
                      value={paymentSettings.bankTransfer.notes}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, notes: e.target.value },
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                      placeholder="Indicá cuándo enviar comprobante, horarios de confirmación, etc."
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Configurá las credenciales de Stripe y Mercado Pago arriba, o definilas como variables de entorno (STRIPE_SECRET_KEY, MERCADOPAGO_ACCESS_TOKEN) en el servidor. La transferencia bancaria no usa credenciales externas.
              </p>

              {message && <p className="text-sm text-gray-600">{message}</p>}

              <button
                onClick={handleSave}
                disabled={loading || saving || !effectiveProviders.length}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar pagos'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
