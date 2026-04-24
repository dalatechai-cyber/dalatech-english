import { MAX_IELTS_RESULTS } from './constants'

const IELTS_STORAGE_KEY = 'core-english-ielts-results'

export interface IELTSResult {
  date: string
  overall: number
  listening: number
  reading: number
  writing: number
  speaking: number
  feedback: string
}

// IELTS question shape supports mixed types:
//   'mc'       — multiple choice (4 options, numeric correct)
//   'tfng'     — True/False/Not Given (options ["True","False","Not Given"], numeric correct)
//   'matching' — matching headings / statements (numeric correct into options)
//   'fill'     — fill-in-the-blank (student types up to 3 words; acceptedAnswers list)
//   'short'    — short-answer (student types a phrase; acceptedAnswers list)
// Legacy content without a `type` is treated as 'mc'.
export type IELTSQuestionType = 'mc' | 'tfng' | 'matching' | 'fill' | 'short'

export interface IELTSQuestion {
  type?: IELTSQuestionType
  question: string
  options?: string[]
  correct?: number
  acceptedAnswers?: string[]
}

export type IELTSAnswer = number | string | null

// New: a single speaker turn in the listening conversation
export interface IELTSConversationTurn {
  speaker: 'A' | 'B'
  text: string
}

// New: 4-criteria writing feedback
export interface IELTSWritingFeedback {
  taskAchievement: number
  coherenceCohesion: number
  lexicalResource: number
  grammaticalRange: number
  band: number
  feedbackMn: string
}

export interface IELTSContent {
  listening: {
    conversation: IELTSConversationTurn[]
    questions: IELTSQuestion[]
  }
  reading: {
    passages: Array<{
      passage: string
      questions: IELTSQuestion[]
    }>
  }
  writing: {
    task1Prompt: string
    task2Prompt: string
  }
  speaking: {
    part1Questions: string[]
    part2Card: string
    part3Questions: string[]
  }
}

export interface IELTSAnswers {
  listeningAnswers: IELTSAnswer[]
  readingAnswers: IELTSAnswer[]
  writingTask1: string
  writingTask2: string
  speakingPart1: string[]
  speakingPart2: string
  speakingPart3: string[]
}

export function loadIELTSResults(): IELTSResult[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(IELTS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as IELTSResult[]) : []
  } catch {
    return []
  }
}

export function saveIELTSResult(result: IELTSResult): void {
  if (typeof window === 'undefined') return
  const results = loadIELTSResults()
  results.unshift(result)
  localStorage.setItem(IELTS_STORAGE_KEY, JSON.stringify(results.slice(0, MAX_IELTS_RESULTS)))
}
