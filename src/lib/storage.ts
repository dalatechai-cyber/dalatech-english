import type { AppProgress, LevelCode, LevelProgress } from './types'

const STORAGE_KEY = 'dalatech-progress'

const DEFAULT_PROGRESS: AppProgress = {
  unlockedLevels: ['A1'],
  levels: {
    A1: {
      unlockedLessons: [1],
      completedLessons: [],
      examPassed: false,
    },
  },
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

export function isLevelUnlocked(levelCode: LevelCode): boolean {
  const p = loadProgress()
  return p.unlockedLevels.includes(levelCode)
}

export function isLessonUnlocked(levelCode: LevelCode, lessonId: number): boolean {
  const p = loadProgress()
  return p.levels[levelCode]?.unlockedLessons.includes(lessonId) ?? false
}

export function markLessonComplete(levelCode: LevelCode, lessonId: number): void {
  const p = loadProgress()
  if (!p.levels[levelCode]) {
    p.levels[levelCode] = { unlockedLessons: [lessonId], completedLessons: [], examPassed: false }
  }
  const lp = p.levels[levelCode]!
  if (!lp.completedLessons.includes(lessonId)) lp.completedLessons.push(lessonId)
  if (lessonId < 10 && !lp.unlockedLessons.includes(lessonId + 1)) {
    lp.unlockedLessons.push(lessonId + 1)
  }
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
