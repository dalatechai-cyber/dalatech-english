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
// Format: wav (PCM). Universally decodable — iOS Safari < 17 has no Ogg/Opus
// support, and the user base includes mobile devices on older iOS. The
// chunk-boundary artefacts that made the previous WAV response sound
// muffled are addressed by fully buffering the upstream body and
// returning a complete payload with Content-Length set (see below).
const PRIMARY_MODEL = 'gpt-4o-mini-tts'
const FALLBACK_MODEL = 'tts-1-hd'
const TTS_SPEED = 0.9
const TTS_RESPONSE_FORMAT = 'wav'
const TTS_CONTENT_TYPE = 'audio/wav'
// Voice pair: nova (Speaker A, female) + onyx (Speaker B, male).
// coral/ash was tried in a prior commit but introduced crackling on both
// channels — a regression against priority 1 (no crackling). Reverted.
// nova/onyx is the stable baseline: only Speaker A crackles (under
// investigation), Speaker B (onyx) is clean.
const VOICE_BY_SPEAKER: Record<'A' | 'B', string> = {
  A: 'nova',
  B: 'onyx',
}
// Per-speaker instructions — gpt-4o-mini-tts honours these as prosody
// directives, not just persona hints. Keep them short, specific, and
// directive. Cover: accent, warmth, pace, pitch variation, emphasis.
// Under OpenAI's 4096-char instructions limit with ample margin.
const INSTRUCTIONS_BY_SPEAKER: Record<'A' | 'B', string> = {
  A: [
    'Voice: warm, articulate British female IELTS examiner — think BBC News presenter.',
    'Tone: friendly, encouraging, professional. Never flat or robotic.',
    'Pace: measured and unhurried, with natural pauses after commas and between clauses.',
    'Prosody: vary your pitch on every sentence. Rise slightly on questions, fall gently on statements, emphasise key nouns and verbs.',
    'Clarity: enunciate consonants crisply. Round vowels as in standard southern British English.',
    'Energy: sound engaged and interested in the conversation, not detached.',
  ].join(' '),
  B: [
    'Voice: resonant, authoritative British male academic — confident, approachable lecturer.',
    'Tone: thoughtful and natural. Never monotone. Never robotic.',
    'Pace: deliberate and steady, with micro-pauses for emphasis on important information.',
    'Prosody: vary your pitch meaningfully across each sentence — dip on subordinate clauses, lift on new ideas, lean into the stressed syllable of key words.',
    'Clarity: articulate clearly with a warm mid-baritone register. Standard British Received Pronunciation.',
    'Energy: sound intellectually engaged and genuinely expressive, as if teaching a student you care about.',
  ].join(' '),
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

    // ── Primary: gpt-4o-mini-tts with instructions ──
    let modelUsed = PRIMARY_MODEL
    const primaryPayload = {
      model: PRIMARY_MODEL,
      voice: VOICE_BY_SPEAKER[speaker],
      input: text,
      speed: TTS_SPEED,
      response_format: TTS_RESPONSE_FORMAT,
      instructions: INSTRUCTIONS_BY_SPEAKER[speaker],
    }

    // Diagnostic: log full outgoing body on every request so Vercel logs
    // always show that `instructions` is reaching OpenAI and is well-formed.
    // Remove this block after user confirms both speaker=A and speaker=B
    // log lines appear with complete, correct instructions.
    {
      const redacted = { ...primaryPayload, input: text.slice(0, 60) + (text.length > 60 ? '…' : '') }
      console.log(`[OpenAI TTS] outgoing speaker=${speaker} body=${JSON.stringify(redacted)}`)
    }

    let r = await callOpenAI(apiKey, primaryPayload)

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

    if (!r.ok) {
      const detail = await r.text().catch(() => 'upstream error')
      console.error('[OpenAI TTS]', modelUsed, r.status, r.statusText, '— body:', detail.slice(0, 500))
      return NextResponse.json({ error: 'Speech service unavailable' }, { status: 502 })
    }

    // Buffer the full upstream body before responding. WAV payloads for
    // short turns are ~50–150KB, so edge memory pressure is negligible.
    // Returning a complete, known-length body eliminates the chunk-boundary
    // artefacts that were producing the muffled/truncated character — the
    // RIFF data-chunk size now matches the payload exactly, so every
    // browser decoder plays the full audio without mid-stream quirks.
    const audio = await r.arrayBuffer()
    console.log(`[OpenAI TTS] ok model=${modelUsed} speaker=${speaker} chars=${text.length} bytes=${audio.byteLength}`)

    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': TTS_CONTENT_TYPE,
        'Content-Length': String(audio.byteLength),
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
