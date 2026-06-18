 'use client'

import { useState } from 'react'
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
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/header'
import Image from 'next/image'
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content.shared'

const navItems = [
  {
    label: 'Dashboard',
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
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-300 ease-in-out flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
      >
        {/* Logo en el sidebar del admin */}
        <div className="p-6 border-b border-gray-200"> {/* Contenedor del logo */}
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center shrink-0">
              {/* Aquí puedes usar el logo de la panadería o un icono de admin */}
              <Image
                src="/img/espiga.png" // Usar el logo por defecto o el que prefieras para admin
                alt="Tiempo Bakery Admin"
                width={36}
                height={36}
                className="h-6 w-6 object-contain"
              />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">Tiempo Bakery</p>
              <p className="text-xs text-gray-500 mt-0.5">Panel de Admin</p>
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
                  isActive
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-amber-600' : 'text-gray-400')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            Volver a la tienda
          </Link>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0"> {/* Se mantiene el contenedor principal */}
        {/* Header para el panel de administración, sin carrito */}
        <Header siteContent={DEFAULT_SITE_CONTENT} showCart={false} />
        <div className="flex-1 p-4 lg:p-6 overflow-auto"> {/* Contenedor de la página */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
              A
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
