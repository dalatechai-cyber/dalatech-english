import { createClient } from '@/lib/supabase/client'
import { loadTestHistory, saveTestResult as saveTestResultLocal, type TestHistoryEntry } from '@/lib/testHistory'
import { MAX_TEST_HISTORY } from '@/lib/constants'

export type { TestHistoryEntry } from '@/lib/testHistory'

interface TestHistoryRow {
  id: string
  type: 'quiz' | 'ielts'
  level: string | null
  score: number | null
  passed: boolean | null
  overall_band: number | null
  listening_score: number | null
  reading_score: number | null
  writing_band: number | null
  speaking_band: number | null
  feedback: string | null
  wrong_answers: string[] | null
  created_at: string
}

function rowToEntry(row: TestHistoryRow): TestHistoryEntry {
  const created = new Date(row.created_at)
  return {
    id: row.id,
    date: created.toISOString().slice(0, 10),
    timestamp: created.getTime(),
    type: row.type,
    level: row.level ?? undefined,
    score: row.score ?? undefined,
    passed: row.passed ?? undefined,
    overallBand: row.overall_band ?? undefined,
    ieltsBand: row.overall_band ?? undefined,
    listeningScore: row.listening_score ?? undefined,
    readingScore: row.reading_score ?? undefined,
    writingBand: row.writing_band ?? undefined,
    speakingBand: row.speaking_band ?? undefined,
    feedback: row.feedback ?? undefined,
    wrongAnswers: row.wrong_answers ?? undefined,
  }
}

export async function getTestHistory(userId: string): Promise<TestHistoryEntry[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('test_history')
      .select('id, type, level, score, passed, overall_band, listening_score, reading_score, writing_band, speaking_band, feedback, wrong_answers, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_TEST_HISTORY)

    if (error) throw error
    return (data ?? []).map(r => rowToEntry(r as TestHistoryRow))
  } catch (e) {
    console.warn('getTestHistory: Supabase failed, falling back to localStorage', e)
    return loadTestHistory()
  }
}

export async function saveTestResult(
  userId: string,
  entry: Omit<TestHistoryEntry, 'id' | 'date'>,
): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('test_history').insert({
      user_id: userId,
      type: entry.type,
      level: entry.level ?? null,
      score: entry.score ?? null,
      passed: entry.passed ?? null,
      overall_band: entry.overallBand ?? entry.ieltsBand ?? null,
      listening_score: entry.listeningScore ?? null,
      reading_score: entry.readingScore ?? null,
      writing_band: entry.writingBand ?? null,
      speaking_band: entry.speakingBand ?? null,
      feedback: entry.feedback ?? null,
      wrong_answers: entry.wrongAnswers ?? null,
    })
    if (error) throw error
  } catch (e) {
    console.warn('saveTestResult: Supabase failed, falling back to localStorage', e)
    saveTestResultLocal(entry)
  }
}
