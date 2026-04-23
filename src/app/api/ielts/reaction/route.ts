import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { CLAUDE_HAIKU_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

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

function wordCount(t: string) {
  return t.trim().split(/\s+/).filter(Boolean).length
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
    const transcript = (body.transcript ?? '').trim().slice(0, 1000)
    const question = (body.question ?? '').trim().slice(0, 500)
    const part = (body.part ?? 1) as 1 | 2 | 3
    const probeUsed = !!body.probeUsed

    if (!transcript) return NextResponse.json(fallback('', probeUsed, part))
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json(fallback(transcript, probeUsed, part))

    const wc = wordCount(transcript)
    const partGuide = part === 3
      ? 'This is Part 3 (discussion). Be more intellectual and debate-style. A follow-up may gently challenge the student — reference their own words, ask whether it might change in the future, or compare Mongolia to other countries. Feel intellectually engaged.'
      : part === 2
      ? 'This comes right after the Part 2 long turn. Give a brief warm reaction and move on — no follow-up.'
      : 'This is Part 1 (warm-up). Be warm and conversational. Any follow-up should feel warm and should reference a specific word or detail the student actually said.'

    const instruction = `You are Sarah, a professional British IELTS examiner who actually listens to the student and responds like a real human examiner.

Question you asked: "${question}"
Student's answer (${wc} words): "${transcript}"
Probe already used for this question: ${probeUsed}
${partGuide}

Decide ONE of:
  PROBE — only if answer is under 30 words AND probeUsed is false. Use a gentle encouragement like: "Could you elaborate on that a little more?" / "Can you give me an example?" / "Tell me a bit more about that."
  FOLLOWUP — when the answer has something specific worth exploring. You MUST reference a specific word, detail, or claim the student actually said. Examples: "You mentioned [word they used] — can you tell me more about that?", "Why do you feel that way?", "How long have you been doing that?", "Has that always been the case?". For Part 3, you may challenge: "Some people would argue the opposite — what would you say to that?" or "Do you think that will change in the future?".
  MOVE_ON — when the answer is 30+ words and complete, OR when probeUsed is already true (never probe twice).

Strict rules:
- NEVER say "Great!", "Excellent!", "Amazing!", or "Perfect!" — they feel fake.
- Prefer short natural acknowledgments: "Mm-hmm.", "Right.", "I see.", "Okay.", "Sure."
- Genuine interest phrases are fine: "Oh, that's interesting.", "That's a good point."
- Natural transitions between questions are fine: "Right, moving on...", "Okay, let's talk about something else."
- A light chuckle sometimes fits: "Ha, yes, that's quite common actually.", "Right, I know what you mean!"
- Reaction must be 1 short sentence.
- Any follow-up must be a single clear question, under 18 words.
- Any follow-up must feel like it came from listening — it must reference the student's actual answer, not be generic.

Return ONLY valid JSON (no code fences, no prose before or after):
{"reaction":"<1 short sentence>","followUp":"<question or null>","moveToNext":<true|false>,"probeUsed":<true|false>}
Rules for the JSON:
- PROBE   -> moveToNext=false, probeUsed=true,  followUp=<probe question>
- FOLLOWUP-> moveToNext=false, probeUsed=${probeUsed}, followUp=<contextual follow-up>
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
