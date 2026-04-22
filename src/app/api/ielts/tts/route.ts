import { NextRequest, NextResponse } from 'next/server'

const VOICE_IDS = {
  rachel: 'Xb7hH8MSUJpSbSDYk0k2', // Alice — British female, speaker A + examiner
  daniel: 'JBFqnCBsd6RMkjVDRZzb', // George — British male, speaker B
} as const

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  console.log('ELEVENLABS_API_KEY exists:', !!process.env.ELEVENLABS_API_KEY)
  console.log('ELEVENLABS_API_KEY length:', process.env.ELEVENLABS_API_KEY?.length)
  console.log('ELEVENLABS_API_KEY first 8 chars:', process.env.ELEVENLABS_API_KEY?.slice(0, 8))
  try {
    const { text, voice } = (await req.json()) as { text?: string; voice?: keyof typeof VOICE_IDS }
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }
    const voiceId = VOICE_IDS[voice ?? 'rachel'] ?? VOICE_IDS.rachel
    const apiKey = process.env.ELEVENLABS_API_KEY
    console.log('EL key:', apiKey?.slice(0, 4), '(len:', apiKey?.length ?? 0, ') voice:', voice, 'chars:', text.length)
    if (!apiKey) {
      return NextResponse.json({ error: 'Server missing ELEVENLABS_API_KEY' }, { status: 500 })
    }

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
      console.error('[ElevenLabs TTS]', r.status, r.statusText, '— body:', msg.slice(0, 500))
      return NextResponse.json({ error: msg, status: r.status, statusText: r.statusText }, { status: r.status })
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
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
