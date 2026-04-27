const KEY_CURRENT = 'core-streak-current'
const KEY_LONGEST = 'core-streak-longest'
const KEY_LAST_DATE = 'core-streak-last-date'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export interface StreakData {
  current: number
  longest: number
  lastDate: string | null
  isNewDay: boolean
  isFirstEver: boolean
}

export type StreakUpdatedDetail = {
  current: number
  longest: number
  lastDate: string
}

export function loadStreak(): StreakData {
  if (typeof window === 'undefined') return { current: 0, longest: 0, lastDate: null, isNewDay: false, isFirstEver: true }
  const current = parseInt(localStorage.getItem(KEY_CURRENT) || '0')
  const longest = parseInt(localStorage.getItem(KEY_LONGEST) || '0')
  const lastDate = localStorage.getItem(KEY_LAST_DATE)
  const today = todayStr()
  const isNewDay = lastDate !== today
  const isFirstEver = lastDate === null
  return { current, longest, lastDate, isNewDay, isFirstEver }
}

export function recordStudySession(): StreakData {
  if (typeof window === 'undefined') return loadStreak()
  const today = todayStr()
  const yesterday = yesterdayStr()
  const lastDate = localStorage.getItem(KEY_LAST_DATE)
  let current = parseInt(localStorage.getItem(KEY_CURRENT) || '0')
  let longest = parseInt(localStorage.getItem(KEY_LONGEST) || '0')

  if (lastDate === today) {
    return { current, longest, lastDate, isNewDay: false, isFirstEver: false }
  }

  if (lastDate === yesterday) {
    current += 1
  } else {
    current = 1
  }

  if (current > longest) longest = current

  try {
    localStorage.setItem(KEY_CURRENT, String(current))
    localStorage.setItem(KEY_LONGEST, String(longest))
    localStorage.setItem(KEY_LAST_DATE, today)
  } catch (e) {
    console.warn('Storage full:', e)
  }

  if (typeof window !== 'undefined') {
    const detail: StreakUpdatedDetail = { current, longest, lastDate: today }
    window.dispatchEvent(new CustomEvent('streak:updated', { detail }))
  }

  return { current, longest, lastDate: today, isNewDay: true, isFirstEver: lastDate === null }
}
