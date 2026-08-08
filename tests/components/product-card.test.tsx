// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string; unoptimized?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ''} />
  },
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardFooter: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span className={className} data-variant={variant}>{children}</span>
  ),
}))

vi.mock('@/components/productos/add-to-cart-button', () => ({
  AddToCartButton: ({ productName, disabled }: { productName: string; disabled?: boolean }) => (
    <button disabled={disabled} data-testid="add-to-cart-btn">
      Agregar al carrito
    </button>
  ),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined | false)[]) => args.filter(Boolean).join(' '),
}))

import { render, screen, cleanup, act } from '@testing-library/react'
import { ProductCard } from '@/components/productos/product-card'

const baseProps = {
  id: 'prod_1',
  name: 'Pan de campo',
  slug: 'pan-de-campo',
  description: 'Pan artesanal con semillas',
  price: 5000,
  imageUrl: '/img/pan.jpg',
  imageAlt: 'Pan de campo',
  allergens: ['gluten', 'sésamo'],
  stock: { available: 10, hasStock: true },
  category: { name: 'Panes' },
}

describe('ProductCard', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renderiza el nombre del producto', () => {
    render(<ProductCard {...baseProps} />)
    expect(screen.getByText('Pan de campo')).toBeDefined()
  })

  it('renderiza el precio formateado', () => {
    render(<ProductCard {...baseProps} />)
    // formatCurrency usa Intl.NumberFormat con ARS — output: "$ 5.000,00"
    expect(screen.getByText(/\$\s?5\.000/)).toBeDefined()
  })

  it('renderiza la imagen del producto', () => {
    render(<ProductCard {...baseProps} />)
    const img = screen.getByRole('img')
    expect(img).toBeDefined()
    expect(img.getAttribute('alt')).toContain('Pan de campo')
  })

  it('renderiza el nombre de la categoría', () => {
    render(<ProductCard {...baseProps} />)
    expect(screen.getByText('Panes')).toBeDefined()
  })

  it('renderiza la descripción del producto', () => {
    render(<ProductCard {...baseProps} />)
    expect(screen.getByText('Pan artesanal con semillas')).toBeDefined()
  })

  it('muestra indicador de stock bajo', () => {
    render(
      <ProductCard
        {...baseProps}
        stock={{ available: 3, hasStock: true, lowStock: true }}
      />
    )
    expect(screen.getByText('¡Últimas unidades!')).toBeDefined()
  })

  it('muestra badge de agotado cuando no hay stock', () => {
    render(
      <ProductCard
        {...baseProps}
        stock={{ available: 0, hasStock: false }}
      />
    )
    expect(screen.getByText('Agotado')).toBeDefined()
  })

  it('deshabilita botón de agregar al carrito cuando no hay stock', () => {
    render(
      <ProductCard
        {...baseProps}
        stock={{ available: 0, hasStock: false }}
      />
    )
    const btn = screen.getByTestId('add-to-cart-btn')
    expect(btn.hasAttribute('disabled')).toBe(true)
  })

  it('habilita botón de agregar al carrito cuando hay stock', () => {
    render(<ProductCard {...baseProps} />)
    const btn = screen.getByTestId('add-to-cart-btn')
    expect(btn.hasAttribute('disabled')).toBe(false)
  })

  it('muestra alérgenos', () => {
    render(<ProductCard {...baseProps} />)
    expect(screen.getByText('gluten')).toBeDefined()
    expect(screen.getByText('sésamo')).toBeDefined()
  })

  it('muestra cantidad de stock disponible', () => {
    render(<ProductCard {...baseProps} />)
    expect(screen.getByText('10 disponibles')).toBeDefined()
  })

  it('no muestra cantidad de stock cuando es muy alto', () => {
    render(
      <ProductCard
        {...baseProps}
        stock={{ available: 999, hasStock: true }}
      />
    )
    expect(screen.queryByText('disponibles')).toBeNull()
  })

  it('muestra peso del producto', () => {
    render(<ProductCard {...baseProps} weight={500} />)
    expect(screen.getByText('500 g')).toBeDefined()
  })

  it('no muestra peso cuando no se proporciona', () => {
    render(<ProductCard {...baseProps} />)
    expect(screen.queryByText(/g$/)).toBeNull()
  })

  it('muestra link al detalle del producto', () => {
    render(<ProductCard {...baseProps} />)
    const links = screen.getAllByRole('link')
    const detailLink = links.find((l) => l.getAttribute('href') === '/productos/pan-de-campo')
    expect(detailLink).toBeTruthy()
  })
})
