import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

// @deepgram/sdk v5 dropped REST prerecorded helpers in favor of WebSocket
// streaming, so we call the Deepgram REST API directly with fetch.
export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_AUDIO_BYTES = 10 * 1024 * 1024 // 10MB

interface DeepgramResponse {
  results?: {
    channels?: {
      alternatives?: { transcript?: string }[]
    }[]
  }
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-stt-deepgram')
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
    const apiKey = process.env.DEEPGRAM_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'Deepgram unavailable' }, { status: 500 })
    }

    const buf = await audio.arrayBuffer()
    const url =
      'https://api.deepgram.com/v1/listen' +
      '?model=nova-2&language=en&smart_format=true&punctuate=true'

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': audio.type || 'audio/webm',
      },
      body: buf,
    })

    if (!r.ok) {
      const msg = await r.text().catch(() => 'upstream error')
      console.error('[Deepgram STT]', r.status, r.statusText, '— body:', msg.slice(0, 500))
      return NextResponse.json({ error: 'Speech service unavailable' }, { status: 502 })
    }

    const data = (await r.json()) as DeepgramResponse
    const text =
      data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? ''
    return NextResponse.json({ text })
  } catch (e) {
    console.error('[Deepgram STT] exception:', e)
    return NextResponse.json({ error: 'Speech service unavailable' }, { status: 500 })
  }
}
