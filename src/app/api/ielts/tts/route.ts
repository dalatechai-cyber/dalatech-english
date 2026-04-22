import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

const VOICE_IDS = {
  alice: 'Xb7hH8MSUJpSbSDYk0k2',
  george: 'JBFqnCBsd6RMkjVDRZzb',
} as const

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-tts')
  if (limited) return limited
  try {
    const body = await req.json().catch(() => null) as { text?: string; voice?: keyof typeof VOICE_IDS } | null
    if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const { text, voice } = body
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }
    const voiceId = VOICE_IDS[voice ?? 'alice'] ?? VOICE_IDS.alice
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim()
    if (!apiKey) return NextResponse.json({ error: 'TTS unavailable' }, { status: 500 })

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_v3',
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      }),
    })

    if (!r.ok) {
      const msg = await r.text().catch(() => 'upstream error')
      console.error('[ElevenLabs TTS]', r.status, r.statusText, '— body:', msg.slice(0, 500))
      return NextResponse.json({ error: 'Speech service unavailable' }, { status: 502 })
    }

    const buf = await r.arrayBuffer()
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (e) {
    console.error('[ElevenLabs TTS] exception:', e)
    return NextResponse.json({ error: 'Speech service unavailable' }, { status: 500 })
  }
}
