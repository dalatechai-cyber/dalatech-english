import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_HAIKU_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

const LISTENING_MODEL = CLAUDE_HAIKU_MODEL
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-generate')
  if (limited) return limited

  const body = await req.json().catch(() => null) as { seed?: number } | null
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const seed = typeof body.seed === 'number' ? body.seed : Date.now()

  const systemPrompt = `You are an IELTS Academic listening section generator. Session: ${seed}. Generate completely fresh academic content. Never repeat topics from previous sessions — never reuse conversations, characters, phrasings, or question stems.

Return ONLY valid JSON matching this exact structure (no prose, no markdown fences):

{
  "listening": {
    "conversation": [
      {"speaker": "A", "text": "..."},
      {"speaker": "B", "text": "..."}
    ],
    "questions": [
      {"type": "mc",   "question": "...", "options": ["...","...","...","..."], "correct": 0},
      {"type": "tfng", "question": "...", "options": ["True","False","Not Given"], "correct": 0},
      {"type": "fill", "question": "...", "acceptedAnswers": ["...","..."]}
    ]
  }
}

Rules:
- conversation: EXACTLY 10 turns, alternating A, B, A, B ... (5 exchanges). Short academic context (university services, study group, library orientation, lecture admin, accommodation, tutor meeting, etc.). Each turn 1-2 sentences. Every factual detail needed to answer the 10 questions must appear somewhere in the conversation.
- questions: EXACTLY 10, in this order and count:
  * items 1-5: "type":"mc" — 4 plausible options, "correct" is 0-based index
  * items 6-8: "type":"tfng" — statement in "question", options EXACTLY ["True","False","Not Given"], "correct" 0-based (0=True, 1=False, 2=Not Given)
  * items 9-10: "type":"fill" — a sentence containing "_____" as the gap; "acceptedAnswers" lists 1-4 acceptable short answers (each max 3 words, lowercase). Include obvious synonym variants (e.g. "12 pm" and "noon").
- Do NOT include an "options" field on fill items.
- Do NOT include an "acceptedAnswers" field on mc or tfng items.`

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
    console.error('Generate listening error (Anthropic call):', e)
    console.error('Error details:', JSON.stringify(e, Object.getOwnPropertyNames(e as object)))
    return NextResponse.json({ error: 'Failed to generate listening content' }, { status: 500 })
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
