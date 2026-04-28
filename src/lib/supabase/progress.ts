import { createClient } from '@/lib/supabase/client'
import {
  loadProgress,
  saveProgress as saveProgressLocal,
  markLessonComplete as markLessonCompleteLocal,
  unlockNextLevel as unlockNextLevelLocal,
} from '@/lib/storage'
import type { AppProgress, LevelCode, LevelProgress } from '@/lib/types'

const ALL_LEVELS: LevelCode[] = ['A1', 'A2', 'B1', 'B2', 'C1']
const ALL_LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

interface ProgressRow {
  level: string
  completed_lessons: number[] | null
  quiz_passed: boolean | null
}

function defaultProgress(): AppProgress {
  return {
    unlockedLevels: [...ALL_LEVELS],
    levels: Object.fromEntries(
      ALL_LEVELS.map(code => [code, { unlockedLessons: [...ALL_LESSONS], completedLessons: [], examPassed: false } as LevelProgress])
    ) as Partial<Record<LevelCode, LevelProgress>>,
  }
}

export async function getProgress(userId: string): Promise<AppProgress> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('progress')
      .select('level, completed_lessons, quiz_passed')
      .eq('user_id', userId)

    if (error) throw error

    const progress = defaultProgress()
    for (const row of (data ?? []) as ProgressRow[]) {
      const code = row.level as LevelCode
      if (!ALL_LEVELS.includes(code)) continue
      progress.levels[code] = {
        unlockedLessons: [...ALL_LESSONS],
        completedLessons: Array.isArray(row.completed_lessons) ? row.completed_lessons : [],
        examPassed: row.quiz_passed === true,
      }
    }
    return progress
  } catch (e) {
    console.warn('getProgress: Supabase failed, falling back to localStorage', e)
    return loadProgress()
  }
}

export async function saveProgress(userId: string, progress: AppProgress): Promise<void> {
  try {
    const supabase = createClient()
    const rows = ALL_LEVELS
      .map(code => {
        const lp = progress.levels[code]
        if (!lp) return null
        return {
          user_id: userId,
          level: code,
          completed_lessons: lp.completedLessons ?? [],
          quiz_passed: lp.examPassed === true,
          updated_at: new Date().toISOString(),
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    if (rows.length === 0) return
    const { error } = await supabase.from('progress').upsert(rows, { onConflict: 'user_id,level' })
    if (error) throw error
  } catch (e) {
    console.warn('saveProgress: Supabase failed, falling back to localStorage', e)
    saveProgressLocal(progress)
  }
}

export async function markLessonComplete(
  userId: string,
  level: LevelCode,
  lessonIndex: number,
): Promise<void> {
  try {
    const supabase = createClient()
    const { data, error: selectError } = await supabase
      .from('progress')
      .select('completed_lessons, quiz_passed')
      .eq('user_id', userId)
      .eq('level', level)
      .maybeSingle()

    if (selectError) throw selectError

    const existing = (data?.completed_lessons as number[] | null) ?? []
    const completed = existing.includes(lessonIndex) ? existing : [...existing, lessonIndex]

    const { error } = await supabase.from('progress').upsert(
      {
        user_id: userId,
        level,
        completed_lessons: completed,
        quiz_passed: data?.quiz_passed ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,level' },
    )
    if (error) throw error
  } catch (e) {
    console.warn('markLessonComplete: Supabase failed, falling back to localStorage', e)
    markLessonCompleteLocal(level, lessonIndex)
  }
}

export async function markQuizPassed(
  userId: string,
  level: LevelCode,
  score: number,
): Promise<void> {
  try {
    const supabase = createClient()
    const { data, error: selectError } = await supabase
      .from('progress')
      .select('completed_lessons')
      .eq('user_id', userId)
      .eq('level', level)
      .maybeSingle()

    if (selectError) throw selectError

    const existing = (data?.completed_lessons as number[] | null) ?? []
    const completed = existing.includes(10) ? existing : [...existing, 10]

    const { error } = await supabase.from('progress').upsert(
      {
        user_id: userId,
        level,
        completed_lessons: completed,
        quiz_passed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,level' },
    )
    if (error) throw error
  } catch (e) {
    console.warn('markQuizPassed: Supabase failed, falling back to localStorage', e)
    unlockNextLevelLocal(level, score)
  }
}
