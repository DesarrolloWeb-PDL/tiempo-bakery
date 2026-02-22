'use client'

import { useEffect, useState } from 'react'
import { BarChart2, RefreshCw, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductRow {
  id: string
  name: string
  slug: string
  imageUrl: string
  price: number
  stockType: string
  weeklyStock: number
  isActive: boolean
  category: { name: string }
  _count: { orderItems: number }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/productos')
      if (!res.ok) throw new Error()
      setProducts(await res.json())
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} productos en catálogo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="divide-y animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
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
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">Producto</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-2">Precio</div>
              <div className="col-span-2">Stock semanal</div>
              <div className="col-span-1">Pedidos</div>
              <div className="col-span-1">Estado</div>
            </div>
            <div className="divide-y divide-gray-50">
              {products.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50/50">
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    {/* Imagen actual */}
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    {/* Subir nueva imagen */}
                    <form
                      className="ml-2"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const fileInput = form.elements.namedItem('file') as HTMLInputElement;
                        if (!fileInput.files?.[0]) return;
                        const data = new FormData();
                        data.append('file', fileInput.files[0]);
                        data.append('productId', p.id);
                        const res = await fetch('/api/admin/productos/upload-image', {
                          method: 'POST',
                          body: data,
                        });
                        if (res.ok) {
                          const { imageUrl } = await res.json();
                          // Actualizar imagen en la BD (requiere endpoint PATCH)
                          await fetch(`/api/admin/productos/${p.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imageUrl }),
                          });
                          fetchProducts();
                        }
                      }}
                    >
                      <input type="file" name="file" accept="image/*" className="text-xs" />
                      <button type="submit" className="text-xs bg-amber-100 px-2 py-1 rounded ml-1">Subir</button>
                    </form>
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {p.category.name}
                    </span>
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(p.price)}</span>
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <span className="text-sm text-gray-600">
                      {p.stockType === 'WEEKLY' ? `${p.weeklyStock} ud/semana` : '∞ Ilimitado'}
                    </span>
                  </div>
                  <div className="col-span-1 hidden md:block">
                    <span className="text-sm text-gray-600">{p._count.orderItems}</span>
                  </div>
                  <div className="col-span-1 hidden md:block">
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium',
                      p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    )}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        La gestión completa de productos (crear, editar, eliminar) se implementará en una fase posterior.
        Para modificar productos, usa <code className="bg-gray-100 px-1 rounded">npm run db:studio</code>
      </p>
    </div>
  )
}
