import type { LevelCode } from './types'

export interface MistakeEntry {
  id: string
  date: string
  level: LevelCode
  original: string
  corrected: string
  explanation: string
}

const KEY = 'core-mistakes'
const MAX = 100

export function loadMistakes(): MistakeEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as MistakeEntry[]
  } catch {
    return []
  }
}

export function saveMistake(entry: Omit<MistakeEntry, 'id' | 'date'>): void {
  if (typeof window === 'undefined') return
  const mistakes = loadMistakes()
  const newEntry: MistakeEntry = {
    ...entry,
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString().slice(0, 10),
  }
  const updated = [newEntry, ...mistakes].slice(0, MAX)
  localStorage.setItem(KEY, JSON.stringify(updated))
}

export function parseCorrectionsFromContent(content: string, level: LevelCode): Omit<MistakeEntry, 'id' | 'date'>[] {
  const regex = /<correction>([\s\S]*?)<\/correction>/g
  const entries: Omit<MistakeEntry, 'id' | 'date'>[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    const block = match[1].trim()
    const origLine = block.match(/❌\s*Алдаа:\s*(.+)/)?.[1]?.trim()
    const corrLine = block.match(/✅\s*Зөв:\s*(.+)/)?.[1]?.trim()
    const explLine = block.match(/💡\s*Тайлбар:\s*([\s\S]+)/)?.[1]?.trim()
    if (origLine && corrLine) {
      entries.push({ level, original: origLine, corrected: corrLine, explanation: explLine || '' })
    }
  }
  return entries
}
