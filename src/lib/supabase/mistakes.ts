import { createClient } from '@/lib/supabase/client'
import { loadMistakes, saveMistake, type MistakeEntry } from '@/lib/mistakes'
import { MAX_MISTAKES } from '@/lib/constants'

export type { MistakeEntry } from '@/lib/mistakes'

export async function getMistakes(userId: string): Promise<MistakeEntry[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('mistakes')
      .select('id, date, level, original, corrected, explanation')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(MAX_MISTAKES)

    if (error) throw error
    return (data ?? []) as MistakeEntry[]
  } catch (e) {
    console.warn('getMistakes: Supabase failed, falling back to localStorage', e)
    return loadMistakes()
  }
}

export async function addMistake(
  userId: string,
  mistake: Omit<MistakeEntry, 'id' | 'date'>
): Promise<MistakeEntry | null> {
  const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const date = new Date().toISOString().slice(0, 10)
  const entry: MistakeEntry = { ...mistake, id, date }

  try {
    const supabase = createClient()
    const { error } = await supabase.from('mistakes').insert({
      id,
      user_id: userId,
      date,
      level: mistake.level,
      original: mistake.original,
      corrected: mistake.corrected,
      explanation: mistake.explanation,
    })

    if (error) throw error
    return entry
  } catch (e) {
    console.warn('addMistake: Supabase failed, falling back to localStorage', e)
    saveMistake(mistake)
    return entry
  }
}

export async function clearMistakes(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('mistakes').delete().eq('user_id', userId)
    if (error) throw error
    return true
  } catch (e) {
    console.warn('clearMistakes: Supabase failed, falling back to localStorage', e)
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('core-mistakes')
      } catch {}
    }
    return false
  }
}
