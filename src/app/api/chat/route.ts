import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import type { LevelCode } from '@/lib/types'
import { getSystemPrompt } from '@/lib/prompts'
import { isContentBlocked, BLOCKED_RESPONSE } from '@/lib/contentFilter'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { messages, level, lessonId } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    level: LevelCode
    lessonId: number
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  if (lastUserMessage && isContentBlocked(lastUserMessage.content)) {
    return new Response(BLOCKED_RESPONSE, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const systemPrompt = getSystemPrompt(level, lessonId)

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
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
