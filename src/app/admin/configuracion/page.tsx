'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, Key, Loader2, Truck, Palette } from 'lucide-react'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function AdminConfigPage() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [loadingShipping, setLoadingShipping] = useState(true)
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
    appSubtitle: 'Panadería artesanal con preventa semanal',
    logoUrl: '/img/espiga.png',
    primaryColor: '#d89a44',
    secondaryColor: '#2c2c2c',
    accentColor: '#f5f5f5',
  })

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

  useEffect(() => {
    void fetchShippingCosts()
    void fetchThemeConfig()
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
        <p className="text-sm text-gray-500 mt-0.5">Ajustes del panel de administración</p>
      </div>

      {/* Seguridad */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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
              en tu archivo <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>
            </p>
            <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg mt-2">
              ⚠️ Si no defines <code>ADMIN_PASSWORD</code>, la contraseña por defecto es <strong>admin123</strong>. 
              Cámbiala antes de desplegar en producción.
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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Settings className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Información del sistema</h3>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {[
            { label: 'Versión', value: '1.0.0' },
            { label: 'Stack', value: 'Next.js 14 + Prisma' },
            { label: 'Base de datos', value: 'SQLite (dev) / PostgreSQL (prod)' },
            { label: 'Pagos', value: 'Stripe' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Envíos */}
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
                onChange={(e) =>
                  setShippingCosts((prev) => ({ ...prev, localDelivery: Number(e.target.value) }))
                }
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
                onChange={(e) =>
                  setShippingCosts((prev) => ({ ...prev, nationalCourier: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(shippingCosts.nationalCourier)}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Recogida en punto siempre se mantiene en <strong>gratis</strong>.
          </p>

          {shippingMsg && <p className="text-sm text-gray-600">{shippingMsg}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSaveShipping}
              disabled={loadingShipping || savingShipping}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {savingShipping ? 'Guardando...' : 'Guardar costos'}
            </button>
            <button
              onClick={handleResetShipping}
              disabled={loadingShipping || savingShipping}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Restablecer
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
              placeholder="Ej: Panadería artesanal con preventa semanal"
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
                <img
                  src={theme.logoUrl}
                  alt="Logo preview"
                  className="h-16 object-contain"
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
            <p className={`text-sm ${themeMsg.includes('correctamente') ? 'text-green-600' : 'text-red-600'}`}>
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
