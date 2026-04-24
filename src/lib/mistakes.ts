import type { LevelCode } from './types'
import { MAX_MISTAKES } from './constants'

export interface MistakeEntry {
  id: string
  date: string
  level: LevelCode
  original: string
  corrected: string
  explanation: string
}

const KEY = 'core-mistakes'

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
  const origTrim = entry.original.trim().toLowerCase()
  const corrTrim = entry.corrected.trim().toLowerCase()
  const deduped = mistakes.filter(
    m => m.original.trim().toLowerCase() !== origTrim || m.corrected.trim().toLowerCase() !== corrTrim
  )
  const newEntry: MistakeEntry = {
    ...entry,
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString().slice(0, 10),
  }
  const updated = [newEntry, ...deduped].slice(0, MAX_MISTAKES)
  try {
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('Storage full:', e)
  }
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
