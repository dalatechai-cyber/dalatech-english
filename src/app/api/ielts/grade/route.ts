import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { IELTSContent, IELTSAnswers, IELTSAnswer, IELTSQuestion } from '@/lib/ielts'
import { CLAUDE_MODEL } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rateLimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
}

function isCorrect(studentAnswer: string, acceptedAnswer: string): boolean {
  const s = normalize(studentAnswer)
  const a = normalize(acceptedAnswer)

  if (s === a) return true

  const acceptedWords = a.split(' ').filter(w => w.length > 2)
  const studentWords = s.split(' ')

  if (acceptedWords.length === 0) return s === a

  const matches = acceptedWords.filter(w => studentWords.includes(w))
  return matches.length / acceptedWords.length >= 0.8
}

function isTextCorrect(student: string, accepted: string[] | undefined): boolean {
  if (!accepted || accepted.length === 0) return false
  if (!student || !student.trim()) return false
  return accepted.some(a => isCorrect(student, a))
}

function countCorrect(answers: IELTSAnswer[], questions: IELTSQuestion[]): number {
  return answers.reduce<number>((n, ans, i) => {
    const q = questions[i]
    if (!q) return n
    const type = q.type ?? 'mc'
    if (type === 'fill' || type === 'short') {
      return typeof ans === 'string' && isTextCorrect(ans, q.acceptedAnswers) ? n + 1 : n
    }
    return typeof ans === 'number' && ans === q.correct ? n + 1 : n
  }, 0)
}

function pctToBand(pct: number): number {
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
  const limited = await checkRateLimit(req, 'ielts-grade')
  if (limited) return limited
  try {
    const body = await req.json().catch(() => null) as { content?: IELTSContent; answers?: IELTSAnswers } | null
    if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const { content, answers } = body
    if (!content || !answers || !content.listening || !content.reading || !content.writing || !content.speaking) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const listenTotal = content.listening.questions.length || 1
    const listenCorrect = countCorrect(answers.listeningAnswers, content.listening.questions)
    const listeningBand = pctToBand(listenCorrect / listenTotal)

    const readingQuestions = content.reading.passages.flatMap(p => p.questions)
    const readTotal = readingQuestions.length || 1
    const readCorrect = countCorrect(answers.readingAnswers, readingQuestions)
    const readingBand = pctToBand(readCorrect / readTotal)

    const speakingText = [
      'PART 1 QUESTIONS AND ANSWERS:\n' + content.speaking.part1Questions.map((q, i) =>
        `Q: ${q}\nA: ${answers.speakingPart1[i] || '(no answer)'}`
      ).join('\n\n'),
      `PART 2 TOPIC CARD:\n${content.speaking.part2Card}\nSTUDENT ANSWER:\n${answers.speakingPart2 || '(no answer)'}`,
      'PART 3 QUESTIONS AND ANSWERS:\n' + content.speaking.part3Questions.map((q, i) =>
        `Q: ${q}\nA: ${answers.speakingPart3[i] || '(no answer)'}`
      ).join('\n\n'),
    ].join('\n\n---\n\n')

    const gradingPrompt = `You are a certified IELTS examiner. Grade the Writing and Speaking sections using official IELTS criteria. Return ONLY valid JSON.

=== WRITING TASK 1 ===
Prompt: ${content.writing.task1Prompt}
Answer: ${answers.writingTask1 || '(no answer provided)'}

=== WRITING TASK 2 ===
Prompt: ${content.writing.task2Prompt}
Answer: ${answers.writingTask2 || '(no answer provided)'}

=== SPEAKING ===
${speakingText}

Score each criterion 1-9. Return this JSON:
{
  "writing": {
    "taskAchievement": 6,
    "coherenceCohesion": 6,
    "lexicalResource": 6,
    "grammaticalRange": 6,
    "band": 6,
    "feedbackMn": "Монгол хэлээр 2-3 өгүүлбэр тайлбар."
  },
  "speaking": {
    "fluencyCohesion": 6,
    "lexicalResource": 6,
    "grammaticalRange": 6,
    "pronunciation": 6,
    "band": 6,
    "feedbackMn": "Монгол хэлээр 2-3 өгүүлбэр тайлбар."
  }
}`

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: 'You are a certified IELTS examiner. Return only valid JSON.',
      messages: [{ role: 'user', content: gradingPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    let writingBand = 5
    let speakingBand = 5
    let writingFeedback = ''
    let speakingFeedback = ''
    let writingCriteria = { taskAchievement: 5, coherenceCohesion: 5, lexicalResource: 5, grammaticalRange: 5 }
    let speakingCriteria = { fluencyCohesion: 5, lexicalResource: 5, grammaticalRange: 5, pronunciation: 5 }

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        writing: { taskAchievement: number; coherenceCohesion: number; lexicalResource: number; grammaticalRange: number; band: number; feedbackMn: string }
        speaking: { fluencyCohesion: number; lexicalResource: number; grammaticalRange: number; pronunciation: number; band: number; feedbackMn: string }
      }
      writingBand = Math.min(9, Math.max(1, parsed.writing.band))
      speakingBand = Math.min(9, Math.max(1, parsed.speaking.band))
      writingFeedback = parsed.writing.feedbackMn
      speakingFeedback = parsed.speaking.feedbackMn
      writingCriteria = {
        taskAchievement: Math.min(9, Math.max(1, parsed.writing.taskAchievement)),
        coherenceCohesion: Math.min(9, Math.max(1, parsed.writing.coherenceCohesion)),
        lexicalResource: Math.min(9, Math.max(1, parsed.writing.lexicalResource)),
        grammaticalRange: Math.min(9, Math.max(1, parsed.writing.grammaticalRange)),
      }
      speakingCriteria = {
        fluencyCohesion: Math.min(9, Math.max(1, parsed.speaking.fluencyCohesion)),
        lexicalResource: Math.min(9, Math.max(1, parsed.speaking.lexicalResource)),
        grammaticalRange: Math.min(9, Math.max(1, parsed.speaking.grammaticalRange)),
        pronunciation: Math.min(9, Math.max(1, parsed.speaking.pronunciation)),
      }
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
      writingCriteria,
      speakingCriteria,
    })
  } catch (e) {
    console.error('IELTS grade error:', e)
    return NextResponse.json({ error: 'Failed to grade test' }, { status: 500 })
  }
}
