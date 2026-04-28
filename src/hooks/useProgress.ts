'use client'
import { useState, useEffect, useCallback } from 'react'
import type { AppProgress, LevelCode } from '@/lib/types'
import {
  loadProgress,
  markLessonComplete as markLessonCompleteLocal,
  unlockNextLevel as unlockNextLevelLocal,
  getLevelProgress,
  isLevelUnlocked,
  isLessonUnlocked,
} from '@/lib/storage'
import {
  getProgress,
  markLessonComplete as markLessonCompleteRemote,
  markQuizPassed as markQuizPassedRemote,
} from '@/lib/supabase/progress'
import { createClient } from '@/lib/supabase/client'

export function useProgress() {
  const [progress, setProgress] = useState<AppProgress>(() => loadProgress())
  const [userId, setUserId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (userId) {
      try {
        setProgress(await getProgress(userId))
        return
      } catch {
        // fall through to localStorage
      }
    }
    setProgress(loadProgress())
  }, [userId])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const completeLesson = useCallback((level: LevelCode, lessonId: number) => {
    if (userId) {
      markLessonCompleteRemote(userId, level, lessonId).then(() => refresh())
    } else {
      markLessonCompleteLocal(level, lessonId)
      refresh()
    }
  }, [refresh, userId])

  const passExam = useCallback((level: LevelCode, score: number) => {
    if (userId) {
      markQuizPassedRemote(userId, level, score).then(() => refresh())
    } else {
      unlockNextLevelLocal(level, score)
      refresh()
    }
  }, [refresh, userId])

  return {
    progress,
    refresh,
    completeLesson,
    passExam,
    isLevelUnlocked: (code: LevelCode) => isLevelUnlocked(code),
    isLessonUnlocked: (code: LevelCode, id: number) => isLessonUnlocked(code, id),
    getLevelProgress: (code: LevelCode) => getLevelProgress(code),
  }
}
