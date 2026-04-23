import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

// Fall back to Sonnet (CLAUDE_MODEL) to confirm the route works. Haiku
// attempt produced HTTP 500s — re-enable once the exact Haiku ID is
// verified via logs.
const LISTENING_MODEL = CLAUDE_MODEL
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-generate')
  if (limited) return limited

  const body = await req.json().catch(() => null) as { seed?: number } | null
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const seed = typeof body.seed === 'number' ? body.seed : Date.now()

  const systemPrompt = `You are an IELTS Academic listening section generator. Session seed: ${seed}.
Return ONLY valid JSON matching this exact structure (no prose, no markdown fences):

{
  "listening": {
    "conversation": [
      {"speaker": "A", "text": "..."},
      {"speaker": "B", "text": "..."}
    ],
    "questions": [
      {"question": "...", "options": ["A","B","C","D"], "correct": 0}
    ]
  }
}

Rules:
- conversation: EXACTLY 10 turns, alternating A, B, A, B ... (5 exchanges). Short academic context (university services, study group, library orientation). Each turn 1-2 sentences.
- questions: exactly 6 multiple-choice, 4 options each, "correct" 0-based index.`

  let text = ''
  try {
    const response = await client.messages.create({
      model: LISTENING_MODEL,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate the IELTS listening section now.' }],
    })
    text = response.content[0]?.type === 'text' ? response.content[0].text : ''
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Generate listening error (Anthropic call):', e)
    console.error('Error details:', JSON.stringify(e, Object.getOwnPropertyNames(e as object)))
    return NextResponse.json({ error: `Anthropic API error: ${msg}` }, { status: 500 })
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('Generate listening: no JSON found in response text:', text.slice(0, 500))
    return NextResponse.json({ error: 'Invalid response format (no JSON)' }, { status: 500 })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (e) {
    console.error('Generate listening: JSON.parse failed:', e, 'raw:', jsonMatch[0].slice(0, 500))
    return NextResponse.json({ error: 'Invalid JSON in model response' }, { status: 500 })
  }

  const p = parsed as { listening?: { conversation?: unknown } }
  if (!p.listening?.conversation || !Array.isArray(p.listening.conversation)) {
    console.error('Generate listening: invalid structure:', JSON.stringify(parsed).slice(0, 500))
    return NextResponse.json({ error: 'Invalid listening structure' }, { status: 500 })
  }
  return NextResponse.json(parsed)
}
