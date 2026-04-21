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

export interface IELTSQuestion {
  question: string
  options: string[]
  correct: number
}

export interface IELTSContent {
  listening: {
    transcript: string
    questions: IELTSQuestion[]
  }
  reading: {
    passage: string
    questions: IELTSQuestion[]
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
  listeningAnswers: (number | null)[]
  readingAnswers: (number | null)[]
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
  localStorage.setItem(IELTS_STORAGE_KEY, JSON.stringify(results.slice(0, 10)))
}
