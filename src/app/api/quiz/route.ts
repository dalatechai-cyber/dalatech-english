import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { LevelCode } from '@/lib/types'
import { getQuizSystemPrompt } from '@/lib/prompts'
import { CLAUDE_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type MCQuestion = { question: string; options: string[]; correct: number; explanation?: string }

type ParsedQuiz = {
  mc_questions: unknown[]
  reading: { passage: string; questions: unknown[] }
  writing: { prompt: string; grammar_focus: string }
}

function validateMCQuestion(q: MCQuestion): { valid: boolean; reason?: string } {
  if (!q.question || typeof q.question !== 'string') return { valid: false, reason: 'stem missing or not a string' }
  if (!q.question.includes('___')) return { valid: false, reason: 'stem missing blank marker ___' }
  if (q.question.split('___').length !== 2) return { valid: false, reason: 'stem must contain exactly one blank' }
  if (!Array.isArray(q.options) || q.options.length !== 4) return { valid: false, reason: 'must have exactly 4 options' }
  if (q.options.some((o) => typeof o !== 'string' || o.trim().length === 0)) return { valid: false, reason: 'all options must be non-empty strings' }
  if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3 || !Number.isInteger(q.correct)) return { valid: false, reason: 'correct must be integer 0-3' }

  const normalizedOptions = q.options.map((o) => o.trim().toLowerCase())
  if (new Set(normalizedOptions).size !== 4) return { valid: false, reason: 'options must be distinct' }

  const stemLower = q.question.toLowerCase()
  const stemWithoutBlank = stemLower.replace('___', ' BLANK ')
  for (const opt of normalizedOptions) {
    const escaped = opt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const wordBoundaryRegex = new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i')
    if (wordBoundaryRegex.test(stemWithoutBlank)) {
      return { valid: false, reason: `option "${opt}" already appears in stem` }
    }
  }

  return { valid: true }
}

function validateQuiz(parsed: ParsedQuiz): { valid: boolean; reason?: string; failedIndex?: number } {
  if (!parsed || typeof parsed !== 'object') return { valid: false, reason: 'response not an object' }
  if (!Array.isArray(parsed.mc_questions)) return { valid: false, reason: 'mc_questions missing or not an array' }
  if (parsed.mc_questions.length < 10) return { valid: false, reason: `only ${parsed.mc_questions.length} MC questions, expected 15` }

  for (let i = 0; i < parsed.mc_questions.length; i++) {
    const result = validateMCQuestion(parsed.mc_questions[i] as MCQuestion)
    if (!result.valid) {
      return { valid: false, reason: result.reason, failedIndex: i }
    }
  }

  return { valid: true }
}

async function generateQuiz(systemPrompt: string, userPrompt: string): Promise<ParsedQuiz | { error: string }> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 3000,
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { error: 'Invalid response format' }

  try {
    return JSON.parse(jsonMatch[0]) as ParsedQuiz
  } catch {
    return { error: 'Failed to parse JSON' }
  }
}

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'quiz')
  if (limited) return limited
  try {
    const body = (await req.json().catch(() => null)) as { level?: LevelCode } | null
    if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const { level } = body
    if (!level) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const systemPrompt = getQuizSystemPrompt(level)

    const firstUserPrompt = `Generate the full quiz for ${level} level.`
    const first = await generateQuiz(systemPrompt, firstUserPrompt)
    if ('error' in first) {
      return NextResponse.json({ error: first.error }, { status: 500 })
    }

    const firstResult = validateQuiz(first)
    if (firstResult.valid) {
      return NextResponse.json(first)
    }

    const failedQuestion =
      typeof firstResult.failedIndex === 'number' ? (first.mc_questions[firstResult.failedIndex] as MCQuestion) : undefined
    console.warn('quiz_validation_failed', {
      level,
      attempt: 1,
      reason: firstResult.reason,
      failedIndex: firstResult.failedIndex,
      stem: failedQuestion?.question,
      options: failedQuestion?.options,
    })

    const retryUserPrompt = `Generate the full quiz for ${level} level. Previous attempt failed validation: ${firstResult.reason}. Regenerate following ALL quality rules in the system prompt, paying extra attention to the rule that was violated.`
    const second = await generateQuiz(systemPrompt, retryUserPrompt)
    if ('error' in second) {
      return NextResponse.json({ error: 'Failed to generate valid quiz after retry', detail: second.error }, { status: 500 })
    }

    const secondResult = validateQuiz(second)
    if (secondResult.valid) {
      return NextResponse.json(second)
    }

    const failedQuestion2 =
      typeof secondResult.failedIndex === 'number' ? (second.mc_questions[secondResult.failedIndex] as MCQuestion) : undefined
    console.warn('quiz_validation_failed', {
      level,
      attempt: 2,
      reason: secondResult.reason,
      failedIndex: secondResult.failedIndex,
      stem: failedQuestion2?.question,
      options: failedQuestion2?.options,
    })

    return NextResponse.json({ error: 'Failed to generate valid quiz after retry', detail: secondResult.reason }, { status: 500 })
  } catch (e) {
    console.error('Quiz generation error:', e)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}
