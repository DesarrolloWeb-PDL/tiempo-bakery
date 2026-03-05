'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, AlertTriangle, CheckCircle2, Database } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProductItem = {
  id: string
  name: string
  slug: string
  imageUrl: string
  imageAlt: string
  isActive: boolean
  published: boolean
  updatedAt: string
  category: { id: string; name: string; slug: string }
}

type AdminDataResponse = {
  summary: {
    products: number
    categories: number
    orders: number
    users: number
    weeklyStockRows: number
    productImageRows: number
  }
  theme: {
    appTitle: string
    appSubtitle: string
    logoUrl: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
  diagnostics: {
    localhostThemeLogo: boolean
    productsWithAbsoluteLocalhostImageCount: number
    productsWithoutImageCount: number
  }
  flagged: {
    productsWithAbsoluteLocalhostImage: Array<{
      id: string
      name: string
      slug: string
      imageUrl: string
    }>
    productsWithoutImage: Array<{
      id: string
      name: string
      slug: string
    }>
  }
  products: ProductItem[]
  fetchedAt: string
}

export default function AdminDatosPage() {
  const [data, setData] = useState<AdminDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/datos', { cache: 'no-store' })
      if (!res.ok) {
        const raw = await res.text()
        let payload: { error?: string; details?: string } = {}
        try {
          payload = JSON.parse(raw)
        } catch {
          payload = {}
        }
        throw new Error(payload.error || payload.details || `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : 'No se pudo cargar la auditoria de datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-600" /> Base de Datos e Imagenes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Vista central de productos, logos e informacion clave de la aplicacion.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ['Productos', data?.summary.products ?? 0],
          ['Categorias', data?.summary.categories ?? 0],
          ['Pedidos', data?.summary.orders ?? 0],
          ['Usuarios', data?.summary.users ?? 0],
          ['Stocks semanales', data?.summary.weeklyStockRows ?? 0],
          ['Imagenes extra', data?.summary.productImageRows ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-gray-900">Tema y logo actual</h3>
            <p className="text-sm text-gray-600">Titulo: {data.theme.appTitle}</p>
            <p className="text-sm text-gray-600">Subtitulo: {data.theme.appSubtitle}</p>
            <p className="text-sm text-gray-600 break-all">Logo URL: {data.theme.logoUrl}</p>
            <div className="pt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.theme.logoUrl}
                alt="Logo actual"
                className="h-14 w-14 object-contain border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <div className="pt-2 flex gap-2">
              <Link
                href="/admin/configuracion"
                className="px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Editar tema/logo
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                {data.diagnostics.localhostThemeLogo || data.diagnostics.productsWithAbsoluteLocalhostImageCount > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
                Diagnostico de URLs de imagen
              </h3>
              <p className="text-sm text-gray-600">
                Logo apuntando a localhost: {data.diagnostics.localhostThemeLogo ? 'SI' : 'NO'}
              </p>
              <p className="text-sm text-gray-600">
                Productos con imagen en localhost: {data.diagnostics.productsWithAbsoluteLocalhostImageCount}
              </p>
              <p className="text-sm text-gray-600">
                Productos sin imagen: {data.diagnostics.productsWithoutImageCount}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Accesos rapidos</h3>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/productos" className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                  Gestionar productos
                </Link>
                <Link href="/admin/stock" className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                  Gestionar stock
                </Link>
                <Link href="/admin/configuracion" className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">
                  Configuracion app
                </Link>
              </div>
            </div>
          </div>

          {data.flagged.productsWithAbsoluteLocalhostImage.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold text-red-800 mb-2">Productos con URL de imagen en localhost</h3>
              <div className="space-y-2">
                {data.flagged.productsWithAbsoluteLocalhostImage.map((p) => (
                  <div key={p.id} className="text-sm text-red-700">
                    {p.name} ({p.slug}) - {p.imageUrl}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Productos e imagenes</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-[540px] overflow-auto">
              {data.products.map((product) => (
                <div key={product.id} className="px-4 py-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl || '/img/espiga.png'}
                    alt={product.imageAlt || product.name}
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200 bg-gray-50"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 truncate">/{product.slug} - {product.category.name}</p>
                    <p className="text-xs text-gray-400 truncate">{product.imageUrl}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-xs font-medium', product.published ? 'text-green-600' : 'text-gray-500')}>
                      {product.published ? 'Publicado' : 'Borrador'}
                    </p>
                    <p className={cn('text-xs font-medium', product.isActive ? 'text-blue-600' : 'text-gray-400')}>
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
