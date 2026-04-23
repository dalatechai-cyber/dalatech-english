import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const RATE_LIMIT_MESSAGE = 'Хэт олон хүсэлт илгээлээ. 1 минут хүлээнэ үү.'

type LimitKey =
  | 'ielts-generate'
  | 'quiz'
  | 'ielts-grade'
  | 'ielts-tts'
  | 'ielts-stt'
  | 'ielts-stt-deepgram'
  | 'chat'
  | 'free-chat'
  | 'ielts-reaction'
  | 'ielts-realtime'

const LIMITS: Record<LimitKey, number> = {
  'ielts-generate': 5,
  quiz: 5,
  'ielts-grade': 10,
  'ielts-tts': 60,
  'ielts-stt': 20,
  'ielts-stt-deepgram': 30,
  chat: 30,
  'free-chat': 30,
  'ielts-reaction': 30,
  'ielts-realtime': 10,
}

let redis: Redis | null = null
const limiters: Partial<Record<LimitKey, Ratelimit>> = {}

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

function getLimiter(key: LimitKey): Ratelimit | null {
  if (limiters[key]) return limiters[key]!
  const r = getRedis()
  if (!r) return null
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(LIMITS[key], '1 m'),
    analytics: false,
    prefix: `ratelimit:${key}`,
  })
  limiters[key] = limiter
  return limiter
}

function getIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

export async function checkRateLimit(
  req: NextRequest,
  key: LimitKey
): Promise<NextResponse | null> {
  const limiter = getLimiter(key)
  if (!limiter) return null
  const ip = getIp(req)
  try {
    const { success } = await limiter.limit(`${key}:${ip}`)
    if (!success) {
      return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 })
    }
    return null
  } catch {
    return null
  }
}
