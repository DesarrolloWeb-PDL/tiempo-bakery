'use client'

import { BarChart2, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'
import { cn } from '@/lib/utils'
import { ProductRow, formatCurrency, formatWeekId } from '@/hooks/use-product-admin'

interface ProductListProps {
  products: ProductRow[]
  loading: boolean
  error: string | null
  deletingId: string | null
  onEdit: (product: ProductRow) => void
  onDelete: (product: ProductRow) => void
  onPublishToggle: (product: ProductRow) => void
}

export default function ProductList({
  products,
  loading,
  error,
  deletingId,
  onEdit,
  onDelete,
  onPublishToggle,
}: ProductListProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      {loading ? (
        <div className="divide-y animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-40" />
                <div className="h-3 bg-gray-700 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <BarChart2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay productos</p>
        </div>
      ) : (
        <>
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-700 border-b border-gray-700 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <div className="col-span-4">Producto</div>
            <div className="col-span-2">Categoría</div>
            <div className="col-span-2">Precio</div>
            <div className="col-span-2">Stock semanal</div>
            <div className="col-span-1">Pedidos</div>
            <div className="col-span-1">Estado</div>
            <div className="col-span-1 text-right">Acciones</div>
          </div>
          <div className="divide-y divide-gray-700">
            {products.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-700/50"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizePublicAssetUrl(p.imageUrl) || '/img/espiga.png'}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover bg-gray-700 shrink-0"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = '/img/espiga.png'
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {p._count.images > 0
                        ? `${p._count.images} imagen${p._count.images === 1 ? '' : 'es'} en banco`
                        : 'Sin imagen en banco'}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                    {p.category.name}
                  </span>
                </div>
                <div className="col-span-2 hidden md:block">
                  <span className="text-sm font-medium text-white">{formatCurrency(p.price)}</span>
                </div>
                <div className="col-span-2 hidden md:block">
                  {p.stockType === 'WEEKLY' ? (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-300 block">
                        {p.weeklyStock} ud/semana
                      </span>
                      {p.currentWeekStock ? (
                        <div className="text-xs text-gray-400 space-y-0.5">
                          <p>
                            {formatWeekId(p.currentWeekStock.weekId)}:{' '}
                            {p.currentWeekStock.available} libres
                          </p>
                          <p>
                            {p.currentWeekStock.reservedStock} reservadas,{' '}
                            {p.currentWeekStock.sold} vendidas
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-brand-gold-dark">
                          Semana actual sin inicializar
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-300">∞ Ilimitado</span>
                  )}
                </div>
                <div className="col-span-1 hidden md:block">
                  <span className="text-sm text-gray-300">{p._count.orderItems}</span>
                </div>
                <div className="col-span-1 hidden md:block">
                  <span
                    className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium',
                      p.isActive
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-gray-700 text-gray-400',
                    )}
                  >
                    {p.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="col-span-1 hidden md:flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void onPublishToggle(p)
                    }}
                    className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium transition-colors',
                      p.published
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600',
                    )}
                    title={p.published ? 'Despublicar' : 'Publicar'}
                  >
                    {p.published ? 'Publicado' : 'Borrador'}
                  </button>
                </div>
                <div className="col-span-1 hidden md:flex justify-end gap-1">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-1.5 text-gray-400 hover:bg-gray-700 rounded-lg"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => void onDelete(p)}
                    disabled={deletingId === p.id}
                    className="p-1.5 text-red-400 hover:bg-red-900/30 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    title={deletingId === p.id ? 'Eliminando...' : 'Eliminar'}
                  >
                    {deletingId === p.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
