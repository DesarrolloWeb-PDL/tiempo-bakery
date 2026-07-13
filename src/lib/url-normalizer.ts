const SUPABASE_STORAGE_PATTERN = '.supabase.co/storage/v1/object/public/'

function isPlaceholderSupabaseUrl(value: string): boolean {
  return value.includes(SUPABASE_STORAGE_PATTERN)
}

function toFallbackOr(raw: string): string {
  const FALLBACK = '/img/espiga.png'
  return isPlaceholderSupabaseUrl(raw) ? FALLBACK : raw
}

export function normalizePublicAssetUrl(value?: string | null): string {
  if (!value) return ''

  const raw = value.trim().replace(/^['"]|['"]$/g, '')
  if (!raw) return ''

  const applyLegacyFallback = (assetPath: string) => {
    const isLegacyLocalProductUpload = assetPath.startsWith('/uploads/productos/')

    if (process.env.NODE_ENV === 'production' && isLegacyLocalProductUpload) {
      return '/img/espiga.png'
    }

    return toFallbackOr(assetPath)
  }

  const isSameOriginHost = (hostname: string) => {
    const configured = process.env.NEXT_PUBLIC_URL?.trim()

    if (configured) {
      try {
        if (new URL(configured).hostname === hostname) {
          return true
        }
      } catch {
        // noop
      }
    }

    if (typeof window !== 'undefined') {
      return window.location.hostname === hostname
    }

    return false
  }

  try {
    const parsed = new URL(raw)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || isSameOriginHost(parsed.hostname)) {
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
