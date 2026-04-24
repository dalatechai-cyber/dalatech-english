import { MAX_TEST_HISTORY } from './constants'

const KEY = 'core-test-history'

export interface TestHistoryEntry {
  id: string
  date: string
  timestamp?: number
  type: 'quiz' | 'ielts'
  // Quiz fields
  level?: string
  score?: number
  total?: number
  passed?: boolean
  // IELTS fields
  ieltsBand?: number
  listeningScore?: number
  readingScore?: number
  writingBand?: number
  speakingBand?: number
  overallBand?: number
  wrongAnswers?: string[]
  feedback?: string
}

export function loadTestHistory(): TestHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as TestHistoryEntry[]
  } catch {
    return []
  }
}

export function saveTestResult(entry: Omit<TestHistoryEntry, 'id' | 'date'>): void {
  if (typeof window === 'undefined') return
  try {
    const history = loadTestHistory()
    const now = Date.now()
    const newEntry: TestHistoryEntry = {
      ...entry,
      id: `test-${now}`,
      date: new Date().toISOString().slice(0, 10),
      timestamp: now,
    }
    history.unshift(newEntry)
    localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX_TEST_HISTORY)))
  } catch (e) {
    console.warn('Storage full:', e)
  }
}
