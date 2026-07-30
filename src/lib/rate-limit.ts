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
  var __tiempoBakeryRateLimitStore: Map<string, { count: number; resetAt: number }> | undefined
}

function getRedisUrl(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
}

function getRedisToken(): string | undefined {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
}

async function createRatelimit(windowMs: number, limit: number) {
  const redisUrl = getRedisUrl()
  const redisToken = getRedisToken()

  if (redisUrl && redisToken) {
    const { Redis } = await import("@upstash/redis")
    const { Ratelimit } = await import("@upstash/ratelimit")
    const redis = new Redis({ url: redisUrl, token: redisToken })
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, windowMs < 1000 ? '1 s' : `${windowMs / 1000} s`),
      analytics: false,
    })
  }

  return null
}

function getFallbackStore() {
  if (!globalThis.__tiempoBakeryRateLimitStore) {
    globalThis.__tiempoBakeryRateLimitStore = new Map()
  }
  return globalThis.__tiempoBakeryRateLimitStore
}

function fallbackConsume(options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now()
  const store = getFallbackStore()

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

export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const ratelimit = await createRatelimit(options.windowMs, options.limit)

  if (!ratelimit) {
    return fallbackConsume(options)
  }

  const result = await ratelimit.limit(options.key)

  return {
    allowed: result.success,
    limit: options.limit,
    remaining: result.remaining,
    retryAfterSeconds: Math.ceil(result.reset / 1000),
    resetAt: result.reset,
  }
}

export function resetRateLimitStore() {
  getFallbackStore().clear()
}