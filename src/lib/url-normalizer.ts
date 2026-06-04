export function normalizePublicAssetUrl(value?: string | null): string {
  if (!value) return ''

  const raw = value.trim().replace(/^['"]|['"]$/g, '')
  if (!raw) return ''

  const applyLegacyFallback = (assetPath: string) => {
    // En producción, los uploads locales legacy no existen en el filesystem de Vercel.
    if (process.env.NODE_ENV === 'production' && assetPath.startsWith('/uploads/productos/')) {
      return '/img/espiga.png'
    }

    return assetPath
  }

  try {
    const parsed = new URL(raw)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/'
      return applyLegacyFallback(normalized)
    }

    return applyLegacyFallback(raw)
  } catch {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(raw)) {
      const withoutHost = raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '')
      return applyLegacyFallback(withoutHost || '/')
    }

    return applyLegacyFallback(raw)
  }
}
