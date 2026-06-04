import { afterEach, describe, expect, it, vi } from 'vitest'
import { normalizePublicAssetUrl } from '@/lib/url-normalizer'

describe('normalizePublicAssetUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('mantiene rutas de serve para uploads temporales y normaliza localhost', () => {
    expect(normalizePublicAssetUrl('/api/admin/uploads/serve?file=pan-campo.jpg')).toBe('/api/admin/uploads/serve?file=pan-campo.jpg')
    expect(normalizePublicAssetUrl('http://localhost:3000/api/admin/uploads/serve?file=hogaza.webp')).toBe('/api/admin/uploads/serve?file=hogaza.webp')
  })

  it('mantiene rutas públicas existentes y normaliza localhost', () => {
    expect(normalizePublicAssetUrl('/uploads/productos/pan-campo.jpg')).toBe('/uploads/productos/pan-campo.jpg')
    expect(normalizePublicAssetUrl('http://localhost:3000/uploads/productos/hogaza.webp')).toBe('/uploads/productos/hogaza.webp')
  })

  it('normaliza valores con espacios/comillas y aplica fallback para uploads legacy en producción', () => {
    vi.stubEnv('NODE_ENV', 'production')

    expect(normalizePublicAssetUrl(" 'http://localhost:3000/img/espiga.png' ")).toBe('/img/espiga.png')
    expect(normalizePublicAssetUrl('/uploads/productos/archivo-inexistente.jpg')).toBe('/img/espiga.png')
    expect(normalizePublicAssetUrl('http://localhost:3000/uploads/productos/archivo-inexistente.jpg')).toBe('/img/espiga.png')
  })
})