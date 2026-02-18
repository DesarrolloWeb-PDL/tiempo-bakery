'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, Key, Loader2 } from 'lucide-react'

export default function AdminConfigPage() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
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
    </div>
  )
}
