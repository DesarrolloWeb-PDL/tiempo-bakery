'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Package,
  BarChart2,
  Database,
  Clock3,
  Users,
  Settings,
  Menu,
  X,
  ArrowLeft,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const navItems = [
  {
    label: 'Panel',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Pedidos',
    href: '/admin/pedidos',
    icon: ShoppingBag,
  },
  {
    label: 'Stock Semanal',
    href: '/admin/stock',
    icon: Package,
  },
  {
    label: 'Productos',
    href: '/admin/productos',
    icon: BarChart2,
  },
  {
    label: 'Base de datos',
    href: '/admin/datos',
    icon: Database,
  },
  {
    label: 'Clientes',
    href: '/admin/clientes',
    icon: Users,
  },
  {
    label: 'Preventa',
    href: '/admin/preventa',
    icon: Clock3,
  },
  {
    label: 'Pagos',
    href: '/admin/pagos',
    icon: CreditCard,
  },
  {
    label: 'Configuración',
    href: '/admin/configuracion',
    icon: Settings,
  },
]
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const pathname = usePathname()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) return
    fetch('/api/admin/tema')
      .then((r) => r.json())
      .then((data) => {
        if (data?.logoUrl) setLogoSrc(data.logoUrl)
        else setLogoSrc(null)
      })
      .catch(() => setLogoSrc(null))
  }, [isLoginPage])

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen lg:flex" style={{ backgroundColor: 'var(--brand-muted-bg)' }}>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-30 transform transition-transform duration-300 ease-in-out flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
        style={{
          backgroundColor: 'var(--brand-sidebar-bg)',
          borderRightColor: 'var(--brand-border)',
          borderRightWidth: '1px',
          width: '16rem',
        }}
      >
        {/* Logo en el sidebar */}
        <div className="p-6" style={{ borderBottomColor: 'var(--brand-border)', borderBottomWidth: '1px' }}>
          <Link href="/admin" className="flex items-center gap-3">
            {logoSrc && (
              <Image
                src={logoSrc}
                alt="Tiempo Bakery Admin"
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
              />
            )}
            <div>
              <p className="font-bold text-sm leading-none" style={{ color: 'var(--brand-text-primary)' }}>Tiempo Bakery</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--brand-text-muted)' }}>Panel de Admin</p>
            </div>
          </Link>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                )}
                style={{
                  color: isActive ? 'var(--brand-primary)' : 'var(--brand-sidebar-text)',
                  backgroundColor: isActive ? 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--brand-primary)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--brand-hover-bg)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Icon className="w-5 h-5 shrink-0" style={{ color: isActive ? 'var(--brand-primary)' : 'var(--brand-text-muted)' }} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 space-y-1" style={{ borderTopColor: 'var(--brand-border)', borderTopWidth: '1px' }}>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--brand-sidebar-text)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--brand-hover-bg)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--brand-text-muted)' }} />
            Volver a la tienda
          </Link>
          <button
            onClick={async () => {
              await fetch('/api/admin/login', { method: 'DELETE' })
              window.location.href = '/admin/login'
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left"
            style={{ color: 'var(--brand-error)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--brand-error) 10%, transparent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <LogOut className="w-5 h-5" style={{ color: 'var(--brand-error)' }} />
            Cerrar sesión
          </button>
        </div>
      </aside>

        {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar simple con hamburguesa y título de página */}
        <header
          className="sticky top-0 z-10 px-4 py-3 flex items-center gap-4 lg:px-6"
          style={{
            backgroundColor: 'var(--brand-bg-card)',
            borderBottomColor: 'var(--brand-border)',
            borderBottomWidth: '1px',
          }}
        >
          <button
            className="p-2 rounded-lg lg:hidden"
            style={{ color: 'var(--brand-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--brand-hover-bg)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </header>

        {/* Página */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
