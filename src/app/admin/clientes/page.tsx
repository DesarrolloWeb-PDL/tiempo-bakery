'use client'

import { useEffect, useState } from 'react'
import { Users, Search, Mail, Phone, MapPin, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'

interface Cliente {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  createdAt: string
  _count: { orders: number }
}

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchClientes = async (q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('search', q)
      params.set('page', String(p))
      params.set('limit', '20')

      const res = await fetch(`/api/admin/clientes?${params}`)
      if (!res.ok) throw new Error('Error al cargar clientes')
      const data = await res.json()
      setClientes(data.users)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch {
      setClientes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes(search, page)
  }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchClientes(search, 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-gold" /> Clientes
        </h1>
        <p className="text-sm text-gray-400 mt-1">{total} clientes registrados</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o telefono..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-700 text-sm bg-gray-800 text-white placeholder-gray-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-brand-gold text-white text-sm font-medium rounded-lg hover:bg-brand-gold-dark"
        >
          Buscar
        </button>
      </form>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-left">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Telefono</th>
                <th className="px-5 py-3 font-medium">Ciudad</th>
                <th className="px-5 py-3 font-medium text-center">Pedidos</th>
                <th className="px-5 py-3 font-medium">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3 text-white font-medium">{c.name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-300">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                        {c.email}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1 text-gray-300">
                          <Phone className="w-3.5 h-3.5 text-gray-500" />
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {c.city ? (
                        <span className="inline-flex items-center gap-1 text-gray-300">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          {c.city}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-300">
                        <ShoppingBag className="w-3.5 h-3.5 text-gray-500" />
                        {c._count.orders}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              Pagina {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {total > 0
          ? `Mostrando ${clientes.length} de ${total} clientes`
          : ''}
      </p>
    </div>
  )
}
