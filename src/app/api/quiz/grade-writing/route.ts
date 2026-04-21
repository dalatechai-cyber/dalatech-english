import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { LevelCode } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { level, prompt, answer, grammarFocus } = await req.json() as {
      level: LevelCode
      prompt: string
      answer: string
      grammarFocus: string
    }

    const systemPrompt = `You are an English writing evaluator for Mongolian learners at ${level} level.

The student was asked: "${prompt}"
The target grammar: ${grammarFocus}

Score the student's response from 0 to 6:
- 6: Perfect use of target grammar, no errors, natural sentences
- 5: Correct target grammar, 1 minor error
- 4: Mostly correct, 1-2 small grammar errors not involving the target
- 3: Target grammar attempted but with errors
- 2: Major errors, target grammar mostly wrong
- 1: Very poor, barely comprehensible
- 0: Off-topic, blank, or not in English

Return ONLY valid JSON, no extra text:
{
  "score": 4,
  "feedback": "Монгол хэлээр 1-2 өгүүлбэрт хариу үнэлгээ."
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: answer || '(no answer provided)' }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ score: 0, feedback: 'Үнэлгээ хийхэд алдаа гарлаа.' })

    const parsed = JSON.parse(jsonMatch[0]) as { score: number; feedback: string }
    return NextResponse.json({ score: Math.min(6, Math.max(0, parsed.score)), feedback: parsed.feedback })
  } catch (e) {
    console.error('Writing grader error:', e)
    return NextResponse.json({ score: 0, feedback: 'Үнэлгээ хийхэд алдаа гарлаа.' })
  }
}
