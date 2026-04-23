import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

// Haiku is ~10x faster than Sonnet for this small generation — acceptable
// because listening conversation + 6 MCQ is simple structured output.
const LISTENING_MODEL = 'claude-haiku-4-5-20251001'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-generate')
  if (limited) return limited
  try {
    const body = await req.json().catch(() => null) as { seed?: number } | null
    if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const seed = typeof body.seed === 'number' ? body.seed : Date.now()

    const systemPrompt = `Seed: ${seed}. Return ONLY valid JSON, no prose.

{"listening":{"conversation":[{"speaker":"A","text":"..."},{"speaker":"B","text":"..."}],"questions":[{"question":"...","options":["A","B","C","D"],"correct":0}]}}

Rules:
- conversation: EXACTLY 10 turns (alternating A, B, A, B, ... 5 exchanges). Short academic context (university services / study group / library). Each turn 1-2 sentences.
- questions: 6 multiple-choice, 4 options each, "correct" 0-based index.`

    const response = await client.messages.create({
      model: LISTENING_MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate now.' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.listening?.conversation || !Array.isArray(parsed.listening.conversation)) {
      return NextResponse.json({ error: 'Invalid listening structure' }, { status: 500 })
    }
    return NextResponse.json(parsed)
  } catch (e) {
    console.error('IELTS generate-listening error:', e)
    return NextResponse.json({ error: 'Failed to generate listening' }, { status: 500 })
  }
}
