import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { LevelCode } from '@/lib/types'
import { getQuizSystemPrompt } from '@/lib/prompts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { level } = await req.json() as { level: LevelCode }
  const systemPrompt = getQuizSystemPrompt(level)

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Generate the full quiz for ${level} level.` }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0]) as {
      mc_questions: unknown[]
      reading: { passage: string; questions: unknown[] }
      writing: { prompt: string; grammar_focus: string }
    }

    if (!parsed.mc_questions || !Array.isArray(parsed.mc_questions) || parsed.mc_questions.length < 10) {
      return NextResponse.json({ error: 'Invalid quiz structure' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (e) {
    console.error('Quiz generation error:', e)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
