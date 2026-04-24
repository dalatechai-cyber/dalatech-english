import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Server missing ELEVENLABS_API_KEY' }, { status: 500 })
  }

  try {
    const r = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey, Accept: 'application/json' },
    })
    if (!r.ok) {
      const msg = await r.text().catch(() => 'upstream error')
      console.error('[ElevenLabs voices]', r.status, msg.slice(0, 500))
      return NextResponse.json({ error: 'Failed to fetch voices' }, { status: r.status })
    }
    const data = (await r.json()) as { voices?: Array<Record<string, unknown>> }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summarized = (data.voices ?? []).map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
      accent: v.labels?.accent,
      gender: v.labels?.gender,
      description: v.labels?.description,
      use_case: v.labels?.use_case,
    }))
    return NextResponse.json({ voices: summarized })
  } catch (e) {
    console.error('[ElevenLabs voices] exception:', e)
    return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 })
  }
}
