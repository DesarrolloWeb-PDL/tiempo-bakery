import {
  type RateLimitOptions,
  type RateLimitResult,
  createFallbackConsume,
} from '@/lib/rate-limit-core'

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

const fallback = createFallbackConsume('__tiempoBakeryRateLimitStore')

export async function consumeRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const ratelimit = await createRatelimit(options.windowMs, options.limit)

  if (!ratelimit) {
    return fallback.consume(options)
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
  fallback.reset()
}
