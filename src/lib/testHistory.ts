const KEY = 'core-test-history'

export interface TestHistoryEntry {
  id: string
  date: string
  type: 'quiz' | 'ielts'
  level?: string
  score?: number
  total?: number
  passed?: boolean
  ieltsBand?: number
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
  const history = loadTestHistory()
  const newEntry: TestHistoryEntry = {
    ...entry,
    id: `test-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
  }
  history.unshift(newEntry)
  try {
    localStorage.setItem(KEY, JSON.stringify(history.slice(0, 50)))
  } catch (e) {
    console.warn('Storage full:', e)
  }
}
