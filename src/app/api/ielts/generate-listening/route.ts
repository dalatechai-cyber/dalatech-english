import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-generate')
  if (limited) return limited
  try {
    const body = await req.json().catch(() => null) as { seed?: number } | null
    if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const seed = typeof body.seed === 'number' ? body.seed : Date.now()

    const systemPrompt = `You are an IELTS Academic listening section generator. Session seed: ${seed}.
Return ONLY valid JSON matching this exact structure:

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

LISTENING section rules:
- 2 speakers: Speaker A and Speaker B
- Academic context: university enrollment office, library orientation, student services, accommodation office, or study group
- EXACTLY 12 turns total (6 exchanges × 2 speakers, alternating A then B)
- Each turn 1-3 sentences
- 6 multiple-choice questions testing key information from the conversation
- "correct" is 0-based index
- Vary context per seed so sessions feel distinct`

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate the IELTS listening section now.' }],
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
