type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
  now?: number
}

type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
  resetAt: number
}

declare global {
  var __tbkRlStore: Map<string, { count: number; resetAt: number }> | undefined
}

function getStore() {
  if (!globalThis.__tbkRlStore) {
    globalThis.__tbkRlStore = new Map()
  }
  return globalThis.__tbkRlStore
}

export function consumeRateLimitEdge(options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now()
  const store = getStore()

  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }

  const existing = store.get(options.key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs
    store.set(options.key, { count: 1, resetAt })
    return {
      allowed: true,
      limit: options.limit,
      remaining: Math.max(options.limit - 1, 0),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      resetAt,
    }
  }

  const nextCount = existing.count + 1
  existing.count = nextCount
  store.set(options.key, existing)

  const remaining = Math.max(options.limit - nextCount, 0)
  const retryAfterSeconds = Math.max(Math.ceil((existing.resetAt - now) / 1000), 1)

  return {
    allowed: nextCount <= options.limit,
    limit: options.limit,
    remaining,
    retryAfterSeconds,
    resetAt: existing.resetAt,
  }
}

export function resetRateLimitStore() {
  getStore().clear()
}
