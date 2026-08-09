'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Eye, EyeOff, Save } from 'lucide-react'

type PaymentSettingsState = {
  defaultProvider: 'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'
  enabledProviders: Array<'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'>
  stripeEnabled: boolean
  mercadopagoEnabled: boolean
  hasStripe: boolean
  hasMercadoPago: boolean
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
  stripeEnabled: false,
  mercadopagoEnabled: false,
  hasStripe: false,
  hasMercadoPago: false,
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

  const effectiveProviders = useMemo(
    () =>
      Array.from(
        new Set([
          ...(paymentSettings.stripeEnabled ? ['STRIPE' as const] : []),
          ...(paymentSettings.mercadopagoEnabled ? ['MERCADO_PAGO' as const] : []),
          ...(bankTransferConfigured ? ['BANK_TRANSFER' as const] : []),
        ])
      ) as Array<'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER'>,
    [paymentSettings.stripeEnabled, paymentSettings.mercadopagoEnabled, bankTransferConfigured]
  )

  const fetchPaymentSettings = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/pagos')
      if (!res.ok) throw new Error('No se pudo cargar la configuracion de pagos')
      const data = await res.json()
      setPaymentSettings({
        ...DEFAULT_PAYMENT_SETTINGS,
        ...data,
        hasStripe: !!data.hasStripe,
        hasMercadoPago: !!data.hasMercadoPago,
        stripeSecretKey: '',
        mercadopagoAccessToken: '',
        bankTransfer: {
          ...DEFAULT_PAYMENT_SETTINGS.bankTransfer,
          ...(data.bankTransfer ?? {}),
        },
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar la configuracion de pagos')
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
      const defaultProvider =
        effectiveProviders.includes(paymentSettings.defaultProvider)
          ? paymentSettings.defaultProvider
          : effectiveProviders[0] || paymentSettings.defaultProvider

      const res = await fetch('/api/admin/pagos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultProvider,
          stripeEnabled: paymentSettings.stripeEnabled,
          mercadopagoEnabled: paymentSettings.mercadopagoEnabled,
          stripeSecretKey: paymentSettings.stripeSecretKey,
          mercadopagoAccessToken: paymentSettings.mercadopagoAccessToken,
          bankTransfer: paymentSettings.bankTransfer,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la configuracion de pagos')

      setMessage('Configuracion guardada. Proveedor por defecto: ' + data.label)
      await fetchPaymentSettings()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la configuracion de pagos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-brand-gold" /> Pagos
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Configura metodos de pago para checkout y defini el proveedor por defecto.
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h2 className="font-semibold text-white text-sm">Metodos disponibles</h2>
        </div>

        <div className="px-5 py-4 space-y-4">
          {loading ? (
            <p className="text-sm text-gray-400">Cargando configuracion...</p>
          ) : (
            <>
              <div className="space-y-2">
                {paymentSettings.options.map((option) => {
                  const available =
                    option.value === 'BANK_TRANSFER'
                      ? bankTransferConfigured
                      : option.value === 'STRIPE'
                        ? paymentSettings.stripeEnabled
                        : option.value === 'MERCADO_PAGO'
                          ? paymentSettings.mercadopagoEnabled
                          : false

                  return (
                    <div key={option.value} className="flex items-center justify-between rounded-lg border border-gray-700 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-white">{option.label}</p>
                        <p className="text-xs text-gray-400">
                          {option.value === 'BANK_TRANSFER'
                            ? available ? 'Configurado' : 'Completa los datos para habilitarlo'
                            : available ? 'Habilitado' : 'Deshabilitado'}
                        </p>
                      </div>
                      <span
                        className={'text-xs font-medium px-2 py-1 rounded-full ' + (available ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400')}
                      >
                        {available ? 'Disponible' : 'Inactivo'}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-700/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Credenciales de API</p>
                  <button
                    type="button"
                    onClick={() => setShowKeys(!showKeys)}
                    className="text-xs text-brand-gold hover:text-brand-gold-dark inline-flex items-center gap-1"
                  >
                    {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showKeys ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-3 border border-gray-700 rounded-lg p-3 bg-gray-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-300">Stripe</label>
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={paymentSettings.stripeEnabled}
                          onChange={(e) =>
                            setPaymentSettings((prev) => ({
                              ...prev,
                              stripeEnabled: e.target.checked,
                            }))
                          }
                          className="rounded"
                        />
                        Habilitado
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Secret Key</label>
                      <input
                        type={showKeys ? 'text' : 'password'}
                        value={paymentSettings.stripeSecretKey}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({
                            ...prev,
                            stripeSecretKey: e.target.value,
                          }))
                        }
                        disabled={!paymentSettings.stripeEnabled}
                        className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white font-mono disabled:opacity-50 disabled:bg-gray-700"
                        placeholder={paymentSettings.hasStripe ? '(Ya configurada - ingresa solo para cambiarla)' : 'sk_live_...'}
                      />
                    </div>
                  </div>
                  <div className="space-y-3 border border-gray-700 rounded-lg p-3 bg-gray-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-300">Mercado Pago</label>
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={paymentSettings.mercadopagoEnabled}
                          onChange={(e) =>
                            setPaymentSettings((prev) => ({
                              ...prev,
                              mercadopagoEnabled: e.target.checked,
                            }))
                          }
                          className="rounded"
                        />
                        Habilitado
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Access Token</label>
                      <input
                        type={showKeys ? 'text' : 'password'}
                        value={paymentSettings.mercadopagoAccessToken}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({
                            ...prev,
                            mercadopagoAccessToken: e.target.value,
                          }))
                        }
                        disabled={!paymentSettings.mercadopagoEnabled}
                        className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white font-mono disabled:opacity-50 disabled:bg-gray-700"
                        placeholder={paymentSettings.hasMercadoPago ? '(Ya configurado - ingresa solo para cambiarlo)' : 'APP_USR-...'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Proveedor por defecto en checkout</label>
                <select
                  value={paymentSettings.defaultProvider}
                  disabled={loading || saving}
                  onChange={(e) =>
                    setPaymentSettings((prev) => ({
                      ...prev,
                      defaultProvider: e.target.value as 'STRIPE' | 'MERCADO_PAGO' | 'BANK_TRANSFER',
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white"
                >
                  {paymentSettings.options.map((option) => {
                    const available =
                      option.value === 'BANK_TRANSFER'
                        ? bankTransferConfigured
                        : option.value === 'STRIPE'
                          ? paymentSettings.stripeEnabled
                          : option.value === 'MERCADO_PAGO'
                            ? paymentSettings.mercadopagoEnabled
                            : false
                    return (
                      <option key={option.value} value={option.value} disabled={!available}>
                        {option.label}{!available ? ' (no disponible)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Transferencia bancaria</p>
                    <p className="text-xs text-gray-400">Se muestra como opcion manual en checkout y confirmacion.</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-300 shrink-0">
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
                    <label className="block text-xs text-gray-400 mb-1">Banco</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.bankName}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, bankName: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white"
                      placeholder="Banco Nacion, Galicia, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Titular</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.accountHolder}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, accountHolder: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white"
                      placeholder="Nombre del titular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Alias</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.alias}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, alias: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white"
                       placeholder="alias.tiempo.masa.madre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">CBU</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.cbu}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, cbu: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white"
                      placeholder="22 digitos"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">CUIT</label>
                    <input
                      type="text"
                      value={paymentSettings.bankTransfer.cuit}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, cuit: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white"
                      placeholder="20-12345678-9"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Notas / instrucciones</label>
                    <textarea
                      value={paymentSettings.bankTransfer.notes}
                      onChange={(e) =>
                        setPaymentSettings((prev) => ({
                          ...prev,
                          bankTransfer: { ...prev.bankTransfer, notes: e.target.value },
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white"
                      placeholder="Indica cuando enviar comprobante, horarios de confirmacion, etc."
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Activa cada proveedor con su toggle, ingresa la credencial correspondiente y guarda. Si desactivas un proveedor, su credencial se elimina de la base de datos. La transferencia bancaria no usa credenciales externas.
              </p>

              {message && <p className="text-sm text-gray-300">{message}</p>}

              <button
                onClick={handleSave}
                disabled={loading || saving || !effectiveProviders.length}
                className="px-4 py-2 bg-brand-gold text-white text-sm font-medium rounded-lg hover:bg-brand-gold-dark disabled:opacity-50 inline-flex items-center gap-2"
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