import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_AUDIO_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-stt')
  if (limited) return limited
  try {
    const inForm = await req.formData()
    const audio = inForm.get('audio')
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: 'Missing audio' }, { status: 400 })
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio too large' }, { status: 413 })
    }
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Speech service unavailable' }, { status: 500 })

    const outForm = new FormData()
    outForm.append('file', audio, 'audio.webm')
    outForm.append('model_id', 'scribe_v1')

    const r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: outForm,
    })

    if (!r.ok) {
      const msg = await r.text().catch(() => 'upstream error')
      console.error('[ElevenLabs STT]', r.status, r.statusText, '— body:', msg.slice(0, 500))
      return NextResponse.json({ error: 'Speech service unavailable' }, { status: 502 })
    }

    const data = (await r.json()) as { text?: string }
    return NextResponse.json({ text: (data.text ?? '').trim() })
  } catch (e) {
    console.error('[ElevenLabs STT] exception:', e)
    return NextResponse.json({ error: 'Speech service unavailable' }, { status: 500 })
  }
}
