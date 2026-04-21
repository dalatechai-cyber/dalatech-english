import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import type { LevelCode } from '@/lib/types'
import { getSystemPrompt } from '@/lib/prompts'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const { messages, level, lessonId } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    level: LevelCode
    lessonId: number
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
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
