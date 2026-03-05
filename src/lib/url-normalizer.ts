export function normalizePublicAssetUrl(value: string): string {
  if (!value) return value

  try {
    const parsed = new URL(value)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`
      return normalized || '/'
    }
    return value
  } catch {
    return value
  }
}
