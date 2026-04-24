import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_HAIKU_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface FeedbackBody {
  listeningScore: number
  readingScore: number
  writingBand: number
  speakingBand: number
  overallBand: number
  wrongAnswers?: string[]
}

function isValid(body: unknown): body is FeedbackBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return ['listeningScore', 'readingScore', 'writingBand', 'speakingBand', 'overallBand']
    .every(k => typeof b[k] === 'number' && Number.isFinite(b[k] as number))
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-feedback')
  if (limited) return limited

  const body = await req.json().catch(() => null)
  if (!isValid(body)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const wrongList = Array.isArray(body.wrongAnswers)
    ? body.wrongAnswers.slice(0, 20).map(s => String(s).slice(0, 300)).join('\n- ')
    : ''
  const wrongSection = wrongList
    ? `\n\nThe student missed these items:\n- ${wrongList}`
    : ''

  const prompt = `You are an IELTS expert examiner.
A student got these scores:
Listening: ${body.listeningScore}/10
Reading: ${body.readingScore}/30
Writing: ${body.writingBand}/9
Speaking: ${body.speakingBand}/9
Overall: ${body.overallBand}/9${wrongSection}

Based on these results give:
1. One paragraph overall assessment
2. Their strongest section and why
3. Their weakest section and why
4. Three specific actionable recommendations
5. What to focus on for next attempt

Write in Mongolian. Be encouraging but honest.
Keep total response under 300 words.`

  let stream
  try {
    stream = await client.messages.stream({
      model: CLAUDE_HAIKU_MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })
  } catch (e) {
    console.error('[ielts-feedback] upstream error:', e)
    return NextResponse.json({ error: 'Upstream AI error' }, { status: 502 })
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (e) {
        console.error('[ielts-feedback] stream error:', e)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
