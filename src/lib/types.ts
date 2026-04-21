export type LevelCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export interface LevelMeta {
  code: LevelCode
  label: string
  description: string
  color: string
  lessons: LessonMeta[]
}

export interface LessonMeta {
  id: number
  title: string
  titleMn: string
  description: string
  isExam: boolean
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  hasCorrection?: boolean
}

export interface LevelProgress {
  unlockedLessons: number[]
  completedLessons: number[]
  examPassed: boolean
  examScore?: number
}

export interface AppProgress {
  unlockedLevels: LevelCode[]
  levels: Partial<Record<LevelCode, LevelProgress>>
}
