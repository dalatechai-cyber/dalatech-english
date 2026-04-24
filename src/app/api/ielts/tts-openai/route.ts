import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

// Tunable TTS config — keep together so voice/model/speed are easy to adjust.
// tts-1 is the real-time model; its output is noticeably muffled / low-bandwidth.
// tts-1-hd produces the clean studio-quality audio IELTS Listening requires.
const TTS_MODEL = 'tts-1-hd'
const TTS_SPEED = 0.9
const TTS_RESPONSE_FORMAT = 'mp3'
const VOICE_BY_SPEAKER: Record<'A' | 'B', string> = {
  A: 'nova',
  B: 'onyx',
}
const MAX_TEXT_LENGTH = 1500

export const runtime = 'edge'

type Body = { text?: unknown; speaker?: unknown }

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

    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice: VOICE_BY_SPEAKER[speaker],
        input: text,
        speed: TTS_SPEED,
        response_format: TTS_RESPONSE_FORMAT,
      }),
      signal: AbortSignal.timeout(20_000),
    })

    if (!r.ok || !r.body) {
      const detail = await r.text().catch(() => 'upstream error')
      console.error('[OpenAI TTS]', r.status, r.statusText, '— body:', detail.slice(0, 500))
      return NextResponse.json(
        { error: 'Speech service unavailable' },
        { status: 502 },
      )
    }

    // Pass OpenAI's audio stream straight through to the client — no full
    // buffering in edge memory. Client builds an object URL from the blob.
    return new Response(r.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
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
