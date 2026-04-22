import { NextRequest, NextResponse } from 'next/server'

const VOICE_IDS = {
  rachel: '21m00Tcm4TlvDq8ikWAM',
  daniel: 'onwK4e9ZLuTAKqWW03F9',
} as const

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = (await req.json()) as { text?: string; voice?: keyof typeof VOICE_IDS }
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }
    const voiceId = VOICE_IDS[voice ?? 'rachel'] ?? VOICE_IDS.rachel
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Server missing ELEVENLABS_API_KEY' }, { status: 500 })

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    })

    if (!r.ok) {
      const msg = await r.text().catch(() => 'upstream error')
      return NextResponse.json({ error: msg }, { status: r.status })
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
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
