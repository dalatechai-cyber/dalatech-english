import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

// Tunable TTS config — keep together so voice/model/speed are easy to adjust.
//
// Primary: gpt-4o-mini-tts with per-speaker `instructions`. It is the
// expressive OpenAI TTS model (March 2025) and fixes the flat/robotic
// prosody we saw with tts-1-hd.
//
// Fallback: tts-1-hd — higher fidelity than tts-1, used if gpt-4o-mini-tts
// is not enabled on this account/region. Logged explicitly on every
// fallback so ops visibility is preserved.
//
// Format: wav (PCM). MP3 introduces lossy encoder artifacts that
// contributed to the muffled character; wav is uncompressed and
// decodes identically on every browser.
const PRIMARY_MODEL = 'gpt-4o-mini-tts'
const FALLBACK_MODEL = 'tts-1-hd'
const TTS_SPEED = 0.9
const TTS_RESPONSE_FORMAT = 'wav'
const VOICE_BY_SPEAKER: Record<'A' | 'B', string> = {
  A: 'nova',
  B: 'onyx',
}
const INSTRUCTIONS_BY_SPEAKER: Record<'A' | 'B', string> = {
  A: 'Speak as a professional British female IELTS examiner. Sound warm, clear, and authoritative. Speak at a measured academic pace. Vary your intonation naturally.',
  B: 'Speak as a professional British male academic. Sound clear, confident and natural. Vary your tone with genuine interest and expression. Do not sound robotic or monotone.',
}
const MAX_TEXT_LENGTH = 1500

export const runtime = 'edge'

type Body = { text?: unknown; speaker?: unknown }

type UpstreamPayload = {
  model: string
  voice: string
  input: string
  speed: number
  response_format: string
  instructions?: string
}

async function callOpenAI(
  apiKey: string,
  payload: UpstreamPayload,
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

// Errors that indicate the primary model isn't available on this account
// (vs. a transient upstream or input problem). We only fall back on these.
function isModelUnavailable(status: number, detail: string): boolean {
  if (status === 404) return true
  if (status === 403) return true
  if (status === 400 && /model|not\s*found|does\s*not\s*exist|unsupported/i.test(detail)) return true
  return false
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-tts-openai')
  if (limited) return limited

  try {
    const body = (await req.json().catch(() => null)) as Body | null
    if (!body) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { text, speaker } = body
    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: 'Text too long' }, { status: 400 })
    }
    if (speaker !== 'A' && speaker !== 'B') {
      return NextResponse.json({ error: 'Invalid speaker' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'TTS unavailable' }, { status: 500 })
    }

    // ── Primary: gpt-4o-mini-tts with instructions ──
    let modelUsed = PRIMARY_MODEL
    let r = await callOpenAI(apiKey, {
      model: PRIMARY_MODEL,
      voice: VOICE_BY_SPEAKER[speaker],
      input: text,
      speed: TTS_SPEED,
      response_format: TTS_RESPONSE_FORMAT,
      instructions: INSTRUCTIONS_BY_SPEAKER[speaker],
    })

    // ── Fallback: tts-1-hd (no instructions) if primary model not enabled ──
    if (!r.ok) {
      const detail = await r.text().catch(() => '')
      if (isModelUnavailable(r.status, detail)) {
        console.warn(
          `[OpenAI TTS] ${PRIMARY_MODEL} unavailable (status=${r.status}) — falling back to ${FALLBACK_MODEL}. Upstream: ${detail.slice(0, 200)}`,
        )
        modelUsed = FALLBACK_MODEL
        r = await callOpenAI(apiKey, {
          model: FALLBACK_MODEL,
          voice: VOICE_BY_SPEAKER[speaker],
          input: text,
          speed: TTS_SPEED,
          response_format: TTS_RESPONSE_FORMAT,
        })
      } else {
        console.error('[OpenAI TTS]', PRIMARY_MODEL, r.status, r.statusText, '— body:', detail.slice(0, 500))
        return NextResponse.json({ error: 'Speech service unavailable' }, { status: 502 })
      }
    }

    if (!r.ok || !r.body) {
      const detail = await r.text().catch(() => 'upstream error')
      console.error('[OpenAI TTS]', modelUsed, r.status, r.statusText, '— body:', detail.slice(0, 500))
      return NextResponse.json({ error: 'Speech service unavailable' }, { status: 502 })
    }

    console.log(`[OpenAI TTS] ok model=${modelUsed} speaker=${speaker} chars=${text.length}`)

    // Pass OpenAI's audio stream straight through to the client — no full
    // buffering in edge memory. Client builds an object URL from the blob.
    return new Response(r.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'private, max-age=3600',
        'X-TTS-Model': modelUsed,
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
