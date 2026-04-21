'use client'
import { useState, useEffect, useCallback } from 'react'
import type { AppProgress, LevelCode } from '@/lib/types'
import {
  loadProgress,
  markLessonComplete,
  unlockNextLevel,
  getLevelProgress,
  isLevelUnlocked,
  isLessonUnlocked,
} from '@/lib/storage'

export function useProgress() {
  const [progress, setProgress] = useState<AppProgress>(() => loadProgress())

  const refresh = useCallback(() => {
    setProgress(loadProgress())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const completeLesson = useCallback((level: LevelCode, lessonId: number) => {
    markLessonComplete(level, lessonId)
    refresh()
  }, [refresh])

  const passExam = useCallback((level: LevelCode, score: number) => {
    unlockNextLevel(level, score)
    refresh()
  }, [refresh])

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
