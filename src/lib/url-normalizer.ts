export function normalizePublicAssetUrl(value?: string | null): string {
  if (!value) return ''

  try {
    const parsed = new URL(value)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      if (parsed.pathname === '/api/admin/uploads/serve') {
        const file = parsed.searchParams.get('file')
        if (file) {
          return `/uploads/productos/${encodeURIComponent(file)}`
        }
      }

      const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`
      return normalized || '/'
    }
    return value
  } catch {
    if (value.startsWith('/api/admin/uploads/serve')) {
      const parsed = new URL(value, 'http://localhost')
      const file = parsed.searchParams.get('file')
      if (file) {
        return `/uploads/productos/${encodeURIComponent(file)}`
      }
    }

    return value
  }
}
