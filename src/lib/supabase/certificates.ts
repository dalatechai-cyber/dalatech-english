import { createClient } from '@/lib/supabase/client'
import {
  loadCertificates,
  saveCertificate as saveCertificateLocal,
  type CertificateEntry,
} from '@/lib/certificates'
import { MAX_CERTIFICATES } from '@/lib/constants'

export type { CertificateEntry } from '@/lib/certificates'

interface CertificateRow {
  id: string
  level: CertificateEntry['level']
  score: number
  total: number
  date: string
  issued_at: number
  type: 'quiz'
}

function rowToEntry(row: CertificateRow): CertificateEntry {
  return {
    id: row.id,
    level: row.level,
    score: row.score,
    total: row.total,
    date: row.date,
    issuedAt: row.issued_at,
    type: row.type,
  }
}

export async function getCertificates(userId: string): Promise<CertificateEntry[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('certificates')
      .select('id, level, score, total, date, issued_at, type')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false })
      .limit(MAX_CERTIFICATES)

    if (error) throw error
    return (data ?? []).map((r) => rowToEntry(r as CertificateRow))
  } catch (e) {
    console.warn('getCertificates: Supabase failed, falling back to localStorage', e)
    return loadCertificates()
  }
}

export async function saveCertificate(
  userId: string,
  certificate: Omit<CertificateEntry, 'id' | 'date' | 'issuedAt'>
): Promise<CertificateEntry> {
  const now = Date.now()
  const today = new Date(now).toISOString().slice(0, 10)
  const id = `cert-${now}`
  const entry: CertificateEntry = { ...certificate, id, date: today, issuedAt: now }

  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('certificates')
      .upsert(
        {
          id,
          user_id: userId,
          level: certificate.level,
          score: certificate.score,
          total: certificate.total,
          date: today,
          issued_at: now,
          type: certificate.type,
        },
        { onConflict: 'user_id,level', ignoreDuplicates: false }
      )
      .select('id, level, score, total, date, issued_at, type')
      .single()

    if (error) throw error
    return data ? rowToEntry(data as CertificateRow) : entry
  } catch (e) {
    console.warn('saveCertificate: Supabase failed, falling back to localStorage', e)
    return saveCertificateLocal(certificate)
  }
}
