'use client'

export type ElevenVoice = 'alice' | 'george'

const audioCache = new Map<string, string>()

function cacheKey(text: string, voice: ElevenVoice) {
  return `${voice}::${text}`
}

export async function generateTTS(text: string, voice: ElevenVoice, signal?: AbortSignal): Promise<string> {
  const key = cacheKey(text, voice)
  const cached = audioCache.get(key)
  if (cached) return cached

  const res = await fetch('/api/ielts/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
    signal,
  })
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  audioCache.set(key, url)
  return url
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
  // FormData is consumed by fetch — rebuild it per attempt so retries work
  const makeBody = () => {
    const fd = new FormData()
    fd.append('audio', blob, 'audio.webm')
    return fd
  }

  let res = await fetch('/api/ielts/stt', { method: 'POST', body: makeBody() })
  // ElevenLabs occasionally returns 401 mid-session; retry once with a fresh request.
  if (res.status === 401) {
    console.warn('[STT] 401 — retrying once with fresh request')
    await new Promise(r => setTimeout(r, 500))
    res = await fetch('/api/ielts/stt', { method: 'POST', body: makeBody() })
  }
  if (!res.ok) {
    // Throwing here signals the caller (collectStudentAnswer) to fall back to
    // the Web Speech transcript captured in parallel — the session continues.
    throw new Error(`STT failed: ${res.status}`)
  }
  const data = (await res.json()) as { text?: string }
  return (data.text ?? '').trim()
}

export async function fetchReaction(transcript: string): Promise<string> {
  try {
    const res = await fetch('/api/ielts/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    })
    if (!res.ok) return 'I see, thank you.'
    const data = (await res.json()) as { reaction?: string }
    return (data.reaction ?? 'I see, thank you.').trim()
  } catch {
    return 'I see, thank you.'
  }
}
