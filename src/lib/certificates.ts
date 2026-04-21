import type { LevelCode } from './types'

export interface CertificateEntry {
  id: string
  level: LevelCode
  score: number
  total: number
  date: string
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

export function saveCertificate(entry: Omit<CertificateEntry, 'id' | 'date'>): CertificateEntry {
  const today = new Date().toISOString().slice(0, 10)
  const cert: CertificateEntry = {
    ...entry,
    id: `cert-${Date.now()}`,
    date: today,
  }
  if (typeof window !== 'undefined') {
    const certs = loadCertificates()
    const existing = certs.find(
      c => c.level === entry.level && c.date === today && c.type === entry.type
    )
    if (existing) return existing
    localStorage.setItem(KEY, JSON.stringify([cert, ...certs]))
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
