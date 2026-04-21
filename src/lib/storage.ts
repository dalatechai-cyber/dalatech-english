import type { AppProgress, LevelCode, LevelProgress } from './types'

const STORAGE_KEY = 'dalatech-progress'

const ALL_LEVELS: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1']
const ALL_LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const DEFAULT_PROGRESS: AppProgress = {
  unlockedLevels: [...ALL_LEVELS],
  levels: Object.fromEntries(
    ALL_LEVELS.map(code => [code, { unlockedLessons: [...ALL_LESSONS], completedLessons: [], examPassed: false }])
  ) as Partial<Record<LevelCode, LevelProgress>>,
}

export function loadProgress(): AppProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROGRESS
    return JSON.parse(raw) as AppProgress
  } catch {
    return DEFAULT_PROGRESS
  }
}

export function saveProgress(progress: AppProgress): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function isLevelUnlocked(_levelCode: LevelCode): boolean {
  return true
}

export function isLessonUnlocked(_levelCode: LevelCode, _lessonId: number): boolean {
  return true
}

export function markLessonComplete(levelCode: LevelCode, lessonId: number): void {
  const p = loadProgress()
  if (!p.levels[levelCode]) {
    p.levels[levelCode] = { unlockedLessons: [...ALL_LESSONS], completedLessons: [], examPassed: false }
  }
  const lp = p.levels[levelCode]!
  if (!lp.completedLessons.includes(lessonId)) lp.completedLessons.push(lessonId)
  saveProgress(p)
}

export function unlockNextLevel(currentLevel: LevelCode, score: number): void {
  const ORDER: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1']
  const idx = ORDER.indexOf(currentLevel)
  const p = loadProgress()

  if (!p.levels[currentLevel]) {
    p.levels[currentLevel] = { unlockedLessons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], completedLessons: [10], examPassed: true }
  }
  const lp = p.levels[currentLevel]!
  lp.examPassed = true
  lp.examScore = score
  if (!lp.completedLessons.includes(10)) lp.completedLessons.push(10)

  if (idx < ORDER.length - 1) {
    const nextLevel = ORDER[idx + 1]
    if (!p.unlockedLevels.includes(nextLevel)) p.unlockedLevels.push(nextLevel)
    if (!p.levels[nextLevel]) {
      p.levels[nextLevel] = { unlockedLessons: [1], completedLessons: [], examPassed: false }
    }
  }
  saveProgress(p)
}

export function getLevelProgress(levelCode: LevelCode): LevelProgress {
  const p = loadProgress()
  return p.levels[levelCode] ?? { unlockedLessons: [], completedLessons: [], examPassed: false }
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
