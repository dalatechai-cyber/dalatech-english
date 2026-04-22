import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { LevelCode } from '@/lib/types'
import { getFreeChatSystemPrompt } from '@/lib/prompts'
import { isContentBlocked, BLOCKED_RESPONSE } from '@/lib/contentFilter'
import { CLAUDE_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'free-chat')
  if (limited) return limited

  const body = await req.json().catch(() => null) as
    | { messages?: unknown; level?: LevelCode }
    | null
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { level } = body
  const rawMessages = body.messages
  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > 40) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const messages = rawMessages.slice(-20).map((m) => {
    const role = (m as { role?: string } | null)?.role
    const content = (m as { content?: string } | null)?.content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    return { role, content: content.slice(0, 4000) }
  }).filter(Boolean) as Array<{ role: 'user' | 'assistant'; content: string }>

  if (messages.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const hasBlocked = messages.some(m => m.role === 'user' && isContentBlocked(m.content))
  if (hasBlocked) {
    return new Response(BLOCKED_RESPONSE, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  const systemPrompt = getFreeChatSystemPrompt(level as LevelCode)

  let stream
  try {
    stream = await client.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })
  } catch (e) {
    console.error('[free-chat] upstream error:', e)
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
        console.error('[free-chat] stream error:', e)
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
