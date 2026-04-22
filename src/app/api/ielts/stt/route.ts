import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const inForm = await req.formData()
    const audio = inForm.get('audio')
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: 'Missing audio' }, { status: 400 })
    }
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Server missing ELEVENLABS_API_KEY' }, { status: 500 })

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
      return NextResponse.json({ error: msg }, { status: r.status })
    }

    const data = (await r.json()) as { text?: string }
    return NextResponse.json({ text: (data.text ?? '').trim() })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
