import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { IELTSContent, IELTSAnswers } from '@/lib/ielts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function scoreListeningReading(answers: (number | null)[], questions: { correct: number }[]): number {
  const correct = answers.filter((a, i) => a === questions[i]?.correct).length
  const total = questions.length
  const pct = correct / total
  if (pct >= 0.9) return 9
  if (pct >= 0.8) return 8
  if (pct >= 0.7) return 7
  if (pct >= 0.6) return 6
  if (pct >= 0.5) return 5
  if (pct >= 0.4) return 4
  if (pct >= 0.3) return 3
  if (pct >= 0.2) return 2
  return 1
}

export async function POST(req: NextRequest) {
  try {
    const { content, answers } = await req.json() as { content: IELTSContent; answers: IELTSAnswers }

    const listeningBand = scoreListeningReading(answers.listeningAnswers, content.listening.questions)
    const readingBand = scoreListeningReading(answers.readingAnswers, content.reading.questions)

    const speakingText = [
      'PART 1:\n' + answers.speakingPart1.filter(Boolean).join('\n'),
      'PART 2:\n' + (answers.speakingPart2 || '(no answer)'),
      'PART 3:\n' + answers.speakingPart3.filter(Boolean).join('\n'),
    ].join('\n\n')

    const gradingPrompt = `You are an IELTS examiner. Grade the following writing and speaking responses.

WRITING TASK 1 PROMPT: ${content.writing.task1Prompt}
WRITING TASK 1 ANSWER: ${answers.writingTask1 || '(no answer)'}

WRITING TASK 2 PROMPT: ${content.writing.task2Prompt}
WRITING TASK 2 ANSWER: ${answers.writingTask2 || '(no answer)'}

SPEAKING PROMPTS AND ANSWERS:
${speakingText}

Give a band score (1-9) for Writing and Speaking separately based on IELTS criteria.
Then write 2-3 sentences of feedback in Mongolian (Cyrillic) for each.

Return ONLY valid JSON:
{
  "writingBand": 6,
  "speakingBand": 6,
  "writingFeedback": "Монгол хэлээр тайлбар.",
  "speakingFeedback": "Монгол хэлээр тайлбар."
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: 'You are an IELTS examiner. Return only valid JSON.',
      messages: [{ role: 'user', content: gradingPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    let writingBand = 5
    let speakingBand = 5
    let writingFeedback = ''
    let speakingFeedback = ''

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        writingBand: number
        speakingBand: number
        writingFeedback: string
        speakingFeedback: string
      }
      writingBand = Math.min(9, Math.max(1, parsed.writingBand))
      speakingBand = Math.min(9, Math.max(1, parsed.speakingBand))
      writingFeedback = parsed.writingFeedback
      speakingFeedback = parsed.speakingFeedback
    }

    const overall = Math.round((listeningBand + readingBand + writingBand + speakingBand) / 4 * 2) / 2

    return NextResponse.json({
      overall,
      listening: listeningBand,
      reading: readingBand,
      writing: writingBand,
      speaking: speakingBand,
      writingFeedback,
      speakingFeedback,
    })
  } catch (e) {
    console.error('IELTS grade error:', e)
    return NextResponse.json({ error: 'Failed to grade test' }, { status: 500 })
  }
}
