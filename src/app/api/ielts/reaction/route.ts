import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const POSITIVE = [
  "That's really interesting, thank you.",
  "I see, that's a great point.",
  "Wonderful, thank you for sharing that.",
  "Absolutely, thank you.",
  "That's very insightful.",
]
const NEUTRAL = [
  "I see, thank you.",
  "Right, okay.",
  "Thank you for that.",
  "Okay, thank you.",
]
const ENCOURAGE = [
  "Could you tell me a little more about that?",
  "Can you expand on that a little?",
  "Interesting — could you elaborate?",
]

function wordCount(t: string) {
  return t.trim().split(/\s+/).filter(Boolean).length
}

function pickFallback(transcript: string): string {
  const wc = wordCount(transcript)
  const pool = wc < 15 ? ENCOURAGE : wc >= 40 ? POSITIVE : NEUTRAL
  return pool[Math.floor(Math.random() * pool.length)]
}

export const runtime = 'nodejs'
export const maxDuration = 20

export async function POST(req: NextRequest) {
  try {
    const { transcript } = (await req.json()) as { transcript?: string }
    const text = (transcript ?? '').trim()
    if (!text) {
      return NextResponse.json({ reaction: pickFallback('') })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ reaction: pickFallback(text) })
    }

    const wc = wordCount(text)
    const instruction = `You are Sarah, a professional IELTS examiner. The student just answered: "${text}"

Choose the single most appropriate 1-sentence reaction from these options:

Positive (detailed/good answers): ${POSITIVE.join(' | ')}
Neutral (short answers): ${NEUTRAL.join(' | ')}
Encouraging (answers under 15 words): ${ENCOURAGE.join(' | ')}

The answer has ${wc} words. If under 15 words, use an Encouraging reaction. Otherwise pick the most appropriate based on quality/detail.

Return ONLY the single reaction sentence with no quotes, no prefix, no explanation.`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{ role: 'user', content: instruction }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const reaction = raw.trim().replace(/^["']|["']$/g, '').split('\n')[0].trim()
    if (!reaction) return NextResponse.json({ reaction: pickFallback(text) })
    return NextResponse.json({ reaction })
  } catch {
    return NextResponse.json({ reaction: pickFallback('') })
  }
}
