'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/productos/product-card'
import { cn } from '@/lib/utils'

interface CategoryProductsCardProps {
  categoria: {
    id: string
    name: string
    description?: string | null
    productos: any[]
  }
  dark: boolean
}

export default function CategoryProductsCard({ categoria, dark }: CategoryProductsCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden transition-colors backdrop-blur-sm',
        dark
          ? 'border-white/10'
          : 'shadow-sm'
      )}
      style={{ backgroundColor: 'rgba(44, 44, 44, 0.85)', borderColor: dark ? 'rgba(255,255,255,0.1)' : 'var(--brand-border)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors',
          dark ? 'hover:bg-white/10' : 'hover:opacity-80'
        )}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-3 mb-1">
            <span
              className={cn(
                'text-xl font-bold truncate',
              )}
              style={!dark ? { color: 'var(--brand-text-primary)' } : undefined}
            >
              {categoria.name}
            </span>
            <Badge variant="secondary">{categoria.productos.length} productos</Badge>
          </span>
          {categoria.description && (
            <span
              className={cn(
                'block text-sm',
              )}
              style={!dark ? { color: 'var(--brand-text-muted)' } : undefined}
            >
              {categoria.description}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 transition-transform duration-300',
            open && 'rotate-180',
            dark ? 'text-white/70' : ''
          )}
          style={!dark ? { color: 'var(--brand-text-muted)' } : undefined}
          aria-hidden="true"
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div
            className="px-5 pb-5 pt-4 border-t"
            style={{ borderColor: dark ? 'rgba(255,255,255,0.1)' : 'var(--brand-border)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoria.productos.map((producto: any) => (
                <ProductCard
                  key={producto.id}
                  id={producto.id}
                  name={producto.name}
                  slug={producto.slug}
                  description={producto.description}
                  price={producto.price}
                  weight={producto.weight}
                  imageUrl={producto.imageUrl}
                  imageAlt={producto.imageAlt}
                  images={producto.images}
                  allergens={producto.allergens}
                  stock={producto.stock}
                  category={producto.category}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
