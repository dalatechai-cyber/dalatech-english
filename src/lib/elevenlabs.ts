'use client'

import { MAX_TTS_CACHE, TTS_RETRY_DELAY_MS } from './constants'

export type ElevenVoice = 'alice' | 'george'

export class ElevenLabsError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ElevenLabsError'
  }
}

export function isQuotaOrRateLimit(err: unknown): boolean {
  if (err instanceof ElevenLabsError) return err.status === 429 || err.status === 502
  const msg = err instanceof Error ? err.message : String(err)
  return /\b(429|502)\b/.test(msg)
}

const audioCache = new Map<string, string>()
const MAX_CACHE = MAX_TTS_CACHE

function cacheKey(text: string, voice: ElevenVoice) {
  return `${voice}::${text}`
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

export async function generateTTS(text: string, voice: ElevenVoice, signal?: AbortSignal): Promise<string> {
  const key = cacheKey(text, voice)
  const cached = audioCache.get(key)
  if (cached) return cached

  try {
    const res = await fetch('/api/ielts/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
      signal,
    })
    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      throw new ElevenLabsError(res.status, `ElevenLabs error ${res.status}: ${errorText}`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    cacheSet(key, url)
    return url
  } catch (e) {
    throw e instanceof Error ? e : new Error(String(e))
  }
}

export function hasCachedTTS(text: string, voice: ElevenVoice): boolean {
  return audioCache.has(cacheKey(text, voice))
}

export function clearTTSCache() {
  audioCache.forEach(url => URL.revokeObjectURL(url))
  audioCache.clear()
}

export interface AudioHandle {
  promise: Promise<void>
  stop: () => void
  audio: HTMLAudioElement
}

export function playAudioURL(url: string): AudioHandle {
  const audio = new Audio(url)
  let settled = false
  const promise = new Promise<void>((resolve) => {
    const done = () => { if (!settled) { settled = true; resolve() } }
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  })
  return {
    promise,
    stop: () => {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch { /* ignore */ }
      if (!settled) { settled = true }
    },
    audio,
  }
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const makeBody = () => {
    const fd = new FormData()
    fd.append('audio', blob, 'audio.webm')
    return fd
  }

  // Try Deepgram Nova-2 first (~200ms typical, more accurate than Web Speech).
  try {
    const dg = await fetch('/api/ielts/stt/deepgram', { method: 'POST', body: makeBody() })
    if (dg.ok) {
      const data = (await dg.json()) as { text?: string }
      const text = (data.text ?? '').trim()
      if (text) return text
    }
  } catch (e) {
    console.warn('[STT] Deepgram failed, falling back to ElevenLabs:', e)
  }

  // Fallback: ElevenLabs Scribe.
  let res = await fetch('/api/ielts/stt', { method: 'POST', body: makeBody() })
  if (res.status === 401) {
    console.warn('[STT] 401 — retrying once with fresh request')
    await new Promise(r => setTimeout(r, TTS_RETRY_DELAY_MS))
    res = await fetch('/api/ielts/stt', { method: 'POST', body: makeBody() })
  }
  if (!res.ok) {
    // Throwing signals caller (collectStudentAnswer) to use the Web Speech
    // transcript captured in parallel — session continues.
    throw new Error(`STT failed: ${res.status}`)
  }
  const data = (await res.json()) as { text?: string }
  return (data.text ?? '').trim()
}

export interface ReactionResult {
  reaction: string
  followUp: string | null
  moveToNext: boolean
  probeUsed: boolean
}

export interface ReactionRequest {
  transcript: string
  question?: string
  part?: 1 | 2 | 3
  probeUsed?: boolean
}

export async function fetchReaction(args: ReactionRequest): Promise<ReactionResult> {
  const fallback: ReactionResult = {
    reaction: 'I see, thank you.',
    followUp: null,
    moveToNext: true,
    probeUsed: !!args.probeUsed,
  }
  try {
    const res = await fetch('/api/ielts/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    })
    if (!res.ok) return fallback
    const data = (await res.json()) as Partial<ReactionResult>
    const rawFollowUp = typeof data.followUp === 'string' ? data.followUp.trim() : ''
    const followUp =
      rawFollowUp && rawFollowUp.toLowerCase() !== 'null' ? rawFollowUp : null
    return {
      reaction: (data.reaction ?? 'I see, thank you.').trim(),
      followUp,
      moveToNext: data.moveToNext ?? true,
      probeUsed: data.probeUsed ?? !!args.probeUsed,
    }
  } catch {
    return fallback
  }
}
