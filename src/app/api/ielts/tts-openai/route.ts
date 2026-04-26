import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

// Tunable TTS config — keep together so voice/model/speed are easy to adjust.
//
// Model: tts-1-hd — clean audio output without the buzzing produced by
// gpt-4o-mini-tts (deprecated Dec 2025, not viable on this setup).
// tts-1-hd does not honour the `instructions` parameter; voices are flat
// but professional. Accepted: real IELTS exam audio is measured, not
// expressive. Priority order: no buzzing > clear audio > expression.
//
// Format: wav (PCM). Universally decodable — iOS Safari < 17 has no Ogg/Opus
// support, and the user base includes mobile devices on older iOS. The
// chunk-boundary artefacts that made the previous WAV response sound
// muffled are addressed by fully buffering the upstream body and
// returning a complete payload with Content-Length set (see below).
const TTS_MODEL = 'tts-1-hd'
const TTS_SPEED = 0.9
const TTS_RESPONSE_FORMAT = 'wav'
const TTS_CONTENT_TYPE = 'audio/wav'
// Voice pair: nova (Speaker A, female) + onyx (Speaker B, male).
// Both verified clean on tts-1-hd via direct API probes (tmp-investigate/).
const VOICE_BY_SPEAKER: Record<'A' | 'B', string> = {
  A: 'nova',
  B: 'onyx',
}
const MAX_TEXT_LENGTH = 1500

export const runtime = 'edge'

type Body = { text?: unknown; speaker?: unknown }

async function callOpenAI(
  apiKey: string,
  payload: { model: string; voice: string; input: string; speed: number; response_format: string },
): Promise<Response> {
  return fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  })
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-tts-openai')
  if (limited) return limited

  try {
    const body = (await req.json().catch(() => null)) as Body | null
    if (!body) {
      console.warn('[OpenAI TTS] 400 invalid_body')
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { text, speaker } = body
    if (typeof text !== 'string' || text.trim().length === 0) {
      console.warn(`[OpenAI TTS] 400 missing_text type=${typeof text} len=${typeof text === 'string' ? text.length : 'n/a'}`)
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }
    if (text.length > MAX_TEXT_LENGTH) {
      console.warn(`[OpenAI TTS] 400 text_too_long len=${text.length} max=${MAX_TEXT_LENGTH}`)
      return NextResponse.json({ error: 'Text too long' }, { status: 400 })
    }
    if (speaker !== 'A' && speaker !== 'B') {
      console.warn(`[OpenAI TTS] 400 invalid_speaker value=${JSON.stringify(speaker)}`)
      return NextResponse.json({ error: 'Invalid speaker' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'TTS unavailable' }, { status: 500 })
    }

    const r = await callOpenAI(apiKey, {
      model: TTS_MODEL,
      voice: VOICE_BY_SPEAKER[speaker],
      input: text,
      speed: TTS_SPEED,
      response_format: TTS_RESPONSE_FORMAT,
    })

    if (!r.ok) {
      const detail = await r.text().catch(() => 'upstream error')
      console.error('[OpenAI TTS]', TTS_MODEL, r.status, r.statusText, '— body:', detail.slice(0, 500))
      return NextResponse.json({ error: 'Speech service unavailable' }, { status: 502 })
    }

    // Buffer the full upstream body before responding. WAV payloads for
    // short turns are ~50–150KB, so edge memory pressure is negligible.
    // Returning a complete, known-length body eliminates the chunk-boundary
    // artefacts that were producing the muffled/truncated character — the
    // RIFF data-chunk size now matches the payload exactly, so every
    // browser decoder plays the full audio without mid-stream quirks.
    const audio = await r.arrayBuffer()
    console.log(`[OpenAI TTS] ok model=${TTS_MODEL} speaker=${speaker} chars=${text.length} bytes=${audio.byteLength}`)

    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': TTS_CONTENT_TYPE,
        'Content-Length': String(audio.byteLength),
        'Cache-Control': 'private, max-age=3600',
        'X-TTS-Model': TTS_MODEL,
      },
    })
  } catch (e) {
    console.error('[OpenAI TTS] exception:', e)
    return NextResponse.json(
      { error: 'Speech service unavailable' },
      { status: 500 },
    )
  }
}
