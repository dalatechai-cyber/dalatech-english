import type { LevelCode } from './types'
import { MAX_CERTIFICATES } from './constants'

export interface CertificateEntry {
  id: string
  level: LevelCode
  score: number
  total: number
  date: string
  issuedAt: number
  type: 'quiz'
}

const KEY = 'core-certificates'

export function loadCertificates(): CertificateEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as CertificateEntry[]
  } catch {
    return []
  }
}

export function saveCertificate(entry: Omit<CertificateEntry, 'id' | 'date' | 'issuedAt'>): CertificateEntry {
  const now = Date.now()
  const today = new Date(now).toISOString().slice(0, 10)
  const cert: CertificateEntry = {
    ...entry,
    id: `cert-${now}`,
    date: today,
    issuedAt: now,
  }
  if (typeof window !== 'undefined') {
    const latest = loadCertificates()
    // One certificate per level, ever. Subsequent passes are captured in
    // test history only — the first certificate is the keepsake.
    const alreadyHasCert = latest.find(c => c.level === entry.level)
    if (alreadyHasCert) return alreadyHasCert
    try {
      localStorage.setItem(KEY, JSON.stringify([cert, ...latest].slice(0, MAX_CERTIFICATES)))
    } catch (e) {
      console.warn('Storage full:', e)
    }
  }
  return cert
}

export function formatMongolianDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  const months = [
    '1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
    '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар',
  ]
  return `${y} оны ${months[parseInt(m) - 1]}ын ${parseInt(d)}`
}

export function hasEverPassedLevel(level: LevelCode): boolean {
  return loadCertificates().some(c => c.level === level && c.type === 'quiz')
}
