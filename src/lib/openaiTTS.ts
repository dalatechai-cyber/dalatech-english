'use client'

import { MAX_TTS_CACHE } from './constants'

export type OpenAISpeaker = 'A' | 'B'

export class OpenAITTSError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'OpenAITTSError'
  }
}

export function isOpenAITTSQuotaOrRateLimit(err: unknown): boolean {
  if (err instanceof OpenAITTSError) return err.status === 429 || err.status === 502
  const msg = err instanceof Error ? err.message : String(err)
  return /\b(429|502)\b/.test(msg)
}

const audioCache = new Map<string, string>()
const MAX_CACHE = MAX_TTS_CACHE

function cacheKey(text: string, speaker: OpenAISpeaker) {
  return `${speaker}::${text}`
}

function cacheSet(key: string, url: string) {
  if (!audioCache.has(key) && audioCache.size >= MAX_CACHE) {
    const oldestKey = audioCache.keys().next().value
    if (oldestKey !== undefined) {
      const oldUrl = audioCache.get(oldestKey)
      if (oldUrl) URL.revokeObjectURL(oldUrl)
      audioCache.delete(oldestKey)
    }
  }
  audioCache.set(key, url)
}

export async function generateOpenAITTS(
  text: string,
  speaker: OpenAISpeaker,
  signal?: AbortSignal,
): Promise<string> {
  const key = cacheKey(text, speaker)
  const cached = audioCache.get(key)
  if (cached) return cached

  const res = await fetch('/api/ielts/tts-openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, speaker }),
    signal,
  })
  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    throw new OpenAITTSError(res.status, `OpenAI TTS ${res.status}: ${errorText.slice(0, 200)}`)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  cacheSet(key, url)
  return url
}

export function clearOpenAITTSCache(): void {
  audioCache.forEach(url => URL.revokeObjectURL(url))
  audioCache.clear()
}
