import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_HAIKU_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'
import { sanitizeForPrompt } from '@/lib/sanitize'
import { wordCount } from '@/lib/textUtils'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Natural reactions for the IELTS examiner — avoid "Great!", "Excellent!",
// "Amazing!", "Perfect!" (feel fake). Mix short acknowledgments, genuine
// interest, natural transitions, and light chuckles.
const ACK_PART1 = [
  'Mm-hmm.',
  'Right.',
  'I see.',
  'Okay.',
  'Sure.',
  "Oh, that's interesting.",
  "That's a good point.",
  "Ha, yes, that's quite common actually.",
  "Right, I know what you mean!",
]
const ACK_PART3 = [
  'Right.',
  'I see.',
  'Mm-hmm.',
  "That's an interesting point.",
  "Yes, I can see why you'd think that.",
  'Okay.',
]
const PROBES = [
  'Could you elaborate on that a little more?',
  'Can you give me an example?',
  'Tell me a bit more about that.',
]

function pickAck(part: 1 | 2 | 3): string {
  const pool = part === 3 ? ACK_PART3 : ACK_PART1
  return pool[Math.floor(Math.random() * pool.length)]
}

interface ReactionPayload {
  reaction: string
  followUp: string | null
  moveToNext: boolean
  probeUsed: boolean
}

function fallback(transcript: string, probeUsed: boolean, part: 1 | 2 | 3 = 1): ReactionPayload {
  const wc = wordCount(transcript)
  if (wc < 30 && !probeUsed) {
    return {
      reaction: 'I see.',
      followUp: PROBES[Math.floor(Math.random() * PROBES.length)],
      moveToNext: false,
      probeUsed: true,
    }
  }
  return {
    reaction: pickAck(part),
    followUp: null,
    moveToNext: true,
    probeUsed,
  }
}

interface RequestBody {
  transcript?: string
  question?: string
  part?: 1 | 2 | 3
  probeUsed?: boolean
}

export const runtime = 'nodejs'
export const maxDuration = 20

export async function POST(req: NextRequest) {
  const limited = await checkRateLimit(req, 'ielts-reaction')
  if (limited) return limited
  try {
    const raw = await req.json().catch(() => null) as RequestBody | null
    if (!raw) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const body = raw
    const transcript = sanitizeForPrompt(body.transcript ?? '', 1000)
    const question = sanitizeForPrompt(body.question ?? '', 500)
    const part = (body.part ?? 1) as 1 | 2 | 3
    const probeUsed = !!body.probeUsed

    if (!transcript) return NextResponse.json(fallback('', probeUsed, part))
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json(fallback(transcript, probeUsed, part))

    const wc = wordCount(transcript)
    const partGuide = part === 3
      ? 'This is Part 3 (discussion). Be more intellectual and debate-style. Part 3 follow-ups may gently challenge: "Some people would argue the opposite though." / "Do you think that will change in the future?" / "Is that specific to Mongolia or more universal?"'
      : part === 2
      ? 'This comes right after the Part 2 long turn. Give a brief warm reaction and move on — no follow-up.'
      : 'This is Part 1 (warm-up). Be warm and curious. Any follow-up should reference a specific word or detail the student actually said.'

    const instruction = `You are Sarah, a warm but professional British IELTS examiner with 10 years of experience.

YOUR PERSONALITY:
- Genuinely curious about student answers
- Warm in Part 1, more intellectual in Part 3
- Uses natural British English expressions
- Has a subtle sense of humour
- Never robotic or formulaic

Question you asked: "${question}"
Student's answer (${wc} words): "${transcript}"
Probe already used for this question: ${probeUsed}
${partGuide}

NATURAL REACTIONS — pick what fits:

Short acknowledgments (use these MOST often):
  "I see.", "Right.", "Mm-hmm.", "Indeed.", "Okay.", "I understand.", "Sure."

Genuine interest (when the answer is detailed):
  "Oh, that's interesting." / "That's a good point, actually." / "I hadn't considered that perspective."

Light chuckle (ONLY when the student is genuinely relatable or funny — never random):
  "Ha, yes, that's quite common actually." / "Right, I know exactly what you mean!" / "Ha, fair enough!"

Gentle probing (when the answer is too short):
  "Could you tell me a bit more about that?" / "Can you elaborate on that point?" / "What do you mean exactly by that?"

Decide ONE of:
  PROBE   — only if answer is under 30 words AND probeUsed is false. Use a gentle probe from above.
  FOLLOWUP — when the answer has something specific worth exploring. You MUST use the student's actual words in the follow-up.
  MOVE_ON — when the answer is 30+ words and complete, OR when probeUsed is already true (never probe twice).

STRICT RULES:
- NEVER say "Great!", "Excellent!", "Amazing!", "Perfect!", or "Wonderful!" — too fake.
- NEVER say "That's a great answer!" or anything similarly evaluative.
- Always use the student's actual words in any follow-up.
- Maximum 2 sentences per reaction. Keep them short and natural.
- Any follow-up must be a single clear question, under 18 words.

Return ONLY valid JSON (no code fences, no prose before or after):
{"reaction":"<short, max 2 sentences>","followUp":"<question or null>","moveToNext":<true|false>,"probeUsed":<true|false>}
Rules for the JSON:
- PROBE   -> moveToNext=false, probeUsed=true,  followUp=<probe question>
- FOLLOWUP-> moveToNext=false, probeUsed=${probeUsed}, followUp=<contextual follow-up that references their actual words>
- MOVE_ON -> moveToNext=true,  probeUsed=${probeUsed}, followUp=null`

    const response = await client.messages.create({
      model: CLAUDE_HAIKU_MODEL,
      max_tokens: 220,
      messages: [{ role: 'user', content: instruction }],
    })

    const rawText = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json(fallback(transcript, probeUsed, part))

    try {
      const parsed = JSON.parse(jsonMatch[0]) as Partial<ReactionPayload>
      const reaction = (parsed.reaction ?? '').trim() || pickAck(part)
      const rawFollowUp =
        typeof parsed.followUp === 'string' ? parsed.followUp.trim() : ''
      const followUp =
        rawFollowUp && rawFollowUp.toLowerCase() !== 'null' ? rawFollowUp : null

      // If the model asked to move on but provided a follow-up, trust the follow-up.
      // If we already used a probe this question, force move-on regardless.
      const moveToNext = probeUsed ? true : followUp ? false : parsed.moveToNext ?? true

      return NextResponse.json({
        reaction,
        followUp: moveToNext ? null : followUp,
        moveToNext,
        probeUsed: !!parsed.probeUsed || probeUsed,
      } as ReactionPayload)
    } catch {
      return NextResponse.json(fallback(transcript, probeUsed, part))
    }
  } catch {
    return NextResponse.json(fallback('', false, 1))
  }
}
