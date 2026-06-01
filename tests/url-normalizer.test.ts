import { describe, expect, it } from 'vitest'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'

describe('normalizePublicAssetUrl', () => {
  it('convierte rutas legacy de upload admin en rutas públicas estáticas', () => {
    expect(normalizePublicAssetUrl('/api/admin/uploads/serve?file=pan-campo.jpg')).toBe('/uploads/productos/pan-campo.jpg')
    expect(normalizePublicAssetUrl('http://localhost:3000/api/admin/uploads/serve?file=hogaza.webp')).toBe('/uploads/productos/hogaza.webp')
  })

  it('mantiene rutas públicas existentes y normaliza localhost', () => {
    expect(normalizePublicAssetUrl('/uploads/productos/pan-campo.jpg')).toBe('/uploads/productos/pan-campo.jpg')
    expect(normalizePublicAssetUrl('http://localhost:3000/uploads/productos/hogaza.webp')).toBe('/uploads/productos/hogaza.webp')
  })
})