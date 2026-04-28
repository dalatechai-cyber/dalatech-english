import { createClient } from '@/lib/supabase/client'
import { loadStreak, recordStudySession, type StreakData } from '@/lib/streak'

export interface StreakRow {
  current_streak: number
  longest_streak: number
  last_activity: string | null
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime()
  const db = new Date(b + 'T00:00:00Z').getTime()
  return Math.round((db - da) / 86_400_000)
}

function rowToStreakData(row: StreakRow): StreakData {
  const today = todayStr()
  const lastDate = row.last_activity
  return {
    current: row.current_streak,
    longest: row.longest_streak,
    lastDate,
    isNewDay: lastDate !== today,
    isFirstEver: lastDate === null,
  }
}

export async function getStreak(userId: string): Promise<StreakRow> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak, last_activity')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return { current_streak: 0, longest_streak: 0, last_activity: null }
    }
    return data as StreakRow
  } catch (e) {
    console.warn('getStreak: Supabase failed, falling back to localStorage', e)
    const local = loadStreak()
    return {
      current_streak: local.current,
      longest_streak: local.longest,
      last_activity: local.lastDate,
    }
  }
}

export async function updateStreak(userId: string): Promise<StreakData> {
  try {
    const supabase = createClient()
    const today = todayStr()
    const yesterday = yesterdayStr()

    const existing = await getStreak(userId)

    if (existing.last_activity === today) {
      return rowToStreakData(existing)
    }

    let current = existing.current_streak
    let longest = existing.longest_streak

    if (existing.last_activity === yesterday) {
      current += 1
    } else {
      current = 1
    }

    if (current > longest) longest = current

    const { error } = await supabase
      .from('streaks')
      .upsert(
        {
          user_id: userId,
          current_streak: current,
          longest_streak: longest,
          last_activity: today,
        },
        { onConflict: 'user_id' }
      )

    if (error) throw error

    return {
      current,
      longest,
      lastDate: today,
      isNewDay: true,
      isFirstEver: existing.last_activity === null,
    }
  } catch (e) {
    console.warn('updateStreak: Supabase failed, falling back to localStorage', e)
    return recordStudySession()
  }
}
