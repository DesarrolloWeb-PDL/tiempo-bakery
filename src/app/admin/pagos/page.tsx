'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Eye, EyeOff, Save } from 'lucide-react'

type PaymentSettingsState = {
  defaultProvider: 'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'
  enabledProviders: Array<'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'>
  stripeKeyMask: string | null
  mercadopagoKeyMask: string | null
  stripeConfigured: boolean
  mercadopagoConfigured: boolean
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
  stripeKeyMask: null,
  mercadopagoKeyMask: null,
  stripeConfigured: false,
  mercadopagoConfigured: false,
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
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsState>(DEFAULT_PAYMENT_SETTINGS)
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [stripeKey, setStripeKey] = useState('')
  const [stripeShowKey, setStripeShowKey] = useState(false)
  const [mercadopagoEnabled, setMercadopagoEnabled] = useState(false)
  const [mercadopagoKey, setMercadopagoKey] = useState('')
  const [mercadopagoShowKey, setMercadopagoShowKey] = useState(false)

  const bankTransferConfigured =
    paymentSettings.bankTransfer.enabled &&
    Boolean(
      paymentSettings.bankTransfer.bankName.trim() ||
      paymentSettings.bankTransfer.accountHolder.trim() ||
      paymentSettings.bankTransfer.alias.trim() ||
      paymentSettings.bankTransfer.cbu.trim()
    )

  const anyProviderConfigured =
    stripeEnabled || mercadopagoEnabled || bankTransferConfigured

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
      setStripeEnabled(data.stripeConfigured ?? false)
      setMercadopagoEnabled(data.mercadopagoConfigured ?? false)
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
      const body: Record<string, unknown> = {
        defaultProvider: paymentSettings.defaultProvider,
        bankTransfer: paymentSettings.bankTransfer,
      }

      if (stripeKey) {
        body.stripeSecretKey = stripeKey
      }

      if (mercadopagoKey) {
        body.mercadopagoAccessToken = mercadopagoKey
      }

      const res = await fetch('/api/admin/pagos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la configuración de pagos')

      setMessage('Configuración de pagos guardada correctamente')
      setStripeKey('')
      setMercadopagoKey('')
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
          Activá los medios de pago y configurá tus credenciales. Se guardan de forma segura en la base de datos.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Métodos de pago</h2>
        </div>

        <div className="px-5 py-4 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-500">Cargando configuración...</p>
          ) : (
            <>
              {/* Stripe */}
              <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Tarjeta con Stripe</p>
                    <p className="text-xs text-gray-500">Pago con tarjeta redirigido a Stripe Checkout.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 shrink-0">
                    <input
                      type="checkbox"
                      checked={stripeEnabled}
                      onChange={(e) => {
                        setStripeEnabled(e.target.checked)
                        if (!e.target.checked) setStripeKey('')
                      }}
                    />
                    Activo
                  </label>
                </div>

                {stripeEnabled && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Clave secreta de Stripe (STRIPE_SECRET_KEY)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={stripeShowKey ? 'text' : 'password'}
                          value={stripeKey}
                          onChange={(e) => setStripeKey(e.target.value)}
                          placeholder={paymentSettings.stripeKeyMask || 'sk_live_...'}
                          className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 text-sm bg-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setStripeShowKey(!stripeShowKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {stripeShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {paymentSettings.stripeKeyMask && !stripeKey && (
                      <p className="text-xs text-gray-400 mt-1">Configurada: {paymentSettings.stripeKeyMask}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Mercado Pago */}
              <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Mercado Pago</p>
                    <p className="text-xs text-gray-500">Checkout Pro con billetera, tarjetas y medios locales.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 shrink-0">
                    <input
                      type="checkbox"
                      checked={mercadopagoEnabled}
                      onChange={(e) => {
                        setMercadopagoEnabled(e.target.checked)
                        if (!e.target.checked) setMercadopagoKey('')
                      }}
                    />
                    Activo
                  </label>
                </div>

                {mercadopagoEnabled && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Access Token de Mercado Pago (MERCADOPAGO_ACCESS_TOKEN)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={mercadopagoShowKey ? 'text' : 'password'}
                          value={mercadopagoKey}
                          onChange={(e) => setMercadopagoKey(e.target.value)}
                          placeholder={paymentSettings.mercadopagoKeyMask || 'APP_USR-...'}
                          className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 text-sm bg-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setMercadopagoShowKey(!mercadopagoShowKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {mercadopagoShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {paymentSettings.mercadopagoKeyMask && !mercadopagoKey && (
                      <p className="text-xs text-gray-400 mt-1">Configurada: {paymentSettings.mercadopagoKeyMask}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bank Transfer */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Transferencia bancaria</p>
                    <p className="text-xs text-gray-500">Se muestra como opción manual en checkout y confirmación. No requiere API keys.</p>
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

                {paymentSettings.bankTransfer.enabled && (
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
                )}
              </div>

              {/* Default provider */}
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
                          ? stripeEnabled
                          : mercadopagoEnabled
                    return (
                      <option key={option.value} value={option.value} disabled={!available}>
                        {option.label}{!available ? ' (no disponible)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              {message && <p className={`text-sm ${message.includes('correctamente') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

              <button
                onClick={handleSave}
                disabled={loading || saving || !anyProviderConfigured}
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
