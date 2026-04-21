'use client'
import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { CertificateModal } from '@/components/CertificateModal'
import { loadCertificates, formatMongolianDate, type CertificateEntry } from '@/lib/certificates'
import { loadTestHistory, type TestHistoryEntry } from '@/lib/testHistory'
import { loadStreak } from '@/lib/streak'
import { loadIELTSResults, type IELTSResult } from '@/lib/ielts'
import { t } from '@/lib/i18n'

export default function ProfilePage() {
  const [certs, setCerts] = useState<CertificateEntry[]>([])
  const [testHistory, setTestHistory] = useState<TestHistoryEntry[]>([])
  const [ieltsHistory, setIeltsHistory] = useState<IELTSResult[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [selectedCert, setSelectedCert] = useState<CertificateEntry | null>(null)

  useEffect(() => {
    setCerts(loadCertificates())
    setTestHistory(loadTestHistory())
    setIeltsHistory(loadIELTSResults())
    const s = loadStreak()
    setStreak({ current: s.current, longest: s.longest })
  }, [])

  return (
    <div className="min-h-screen bg-navy">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 page-enter-up">

        {/* Stats hero row */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div
            className="rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold"
            style={{
              background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B66, #F59E0B22) border-box',
              border: '1px solid transparent',
            }}
          >
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-3xl font-extrabold text-gold" style={{ letterSpacing: '-0.03em' }}>{streak.current}</div>
            <div className="text-xs mt-1" style={{ color: '#64748B' }}>Одоогийн streak</div>
          </div>
          <div
            className="rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-gold"
            style={{
              background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B66, #F59E0B22) border-box',
              border: '1px solid transparent',
            }}
          >
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-3xl font-extrabold text-gold" style={{ letterSpacing: '-0.03em' }}>{streak.longest}</div>
            <div className="text-xs mt-1" style={{ color: '#64748B' }}>Хамгийн урт streak</div>
          </div>
        </div>

        {/* Certificates */}
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="text-gold">▎</span> 🎓 {t('certificates')}
        </h2>

        {certs.length === 0 ? (
          <div className="text-center py-10 mb-8 bg-navy-surface border border-navy-surface-2 rounded-2xl">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-sm text-text-secondary">{t('noCertificates')}</p>
            <p className="text-xs mt-2" style={{ color: '#64748B' }}>Тест өгч 18/25 аваад гэрчилгээ аваарай!</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {certs.map(cert => (
              <button
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className="w-full rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-gold text-left"
                style={{
                  background: 'linear-gradient(#1E293B, #1E293B) padding-box, linear-gradient(135deg, #F59E0B, #FCD34D) border-box',
                  border: '1px solid transparent',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-navy"
                  style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                >
                  {cert.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm" style={{ letterSpacing: '-0.01em' }}>
                    {cert.level} Тест гэрчилгээ
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                    {cert.score}/{cert.total} оноо · {formatMongolianDate(cert.date)}
                  </div>
                </div>
                <div className="text-gold text-xs font-semibold flex-shrink-0">Харах →</div>
              </button>
            ))}
          </div>
        )}

        {/* Test History */}
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="text-gold">▎</span> 📋 Шалгалтын түүх
        </h2>

        {testHistory.length === 0 ? (
          <div className="text-center py-10 mb-8 bg-navy-surface border border-navy-surface-2 rounded-2xl">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm text-text-secondary">Шалгалтын түүх байхгүй байна.</p>
            <p className="text-xs mt-2" style={{ color: '#64748B' }}>Тест эсвэл IELTS өгсний дараа энд харагдана.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {testHistory.map(entry => (
              <div
                key={entry.id}
                className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 text-lg">
                  {entry.type === 'ielts' ? '📝' : '📖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm">
                    {entry.type === 'ielts' ? 'IELTS Mock Test' : `${entry.level} Тест`}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                    {entry.type === 'ielts'
                      ? `Band ${entry.ieltsBand ?? '—'}`
                      : `${entry.score ?? 0}/${entry.total ?? 25} оноо`}
                    {' · '}{formatMongolianDate(entry.date)}
                  </div>
                </div>
                {entry.type === 'quiz' && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    entry.passed
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {entry.passed ? 'Тэнцсэн' : 'Тэнцээгүй'}
                  </span>
                )}
                {entry.type === 'ielts' && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    (entry.ieltsBand ?? 0) >= 5
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    Band {entry.ieltsBand ?? '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* IELTS History */}
        {ieltsHistory.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-gold">▎</span> 📝 IELTS Түүх
            </h2>
            <div className="space-y-3">
              {ieltsHistory.map((r, i) => (
                <div
                  key={i}
                  className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 flex items-center gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-navy text-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
                  >
                    {r.overall}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text-primary text-sm">IELTS Overall Band</div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                      L:{r.listening} R:{r.reading} W:{r.writing} S:{r.speaking}
                      {' · '}{formatMongolianDate(r.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedCert && (
        <CertificateModal
          level={selectedCert.level}
          score={selectedCert.score}
          total={selectedCert.total}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  )
}
