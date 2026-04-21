'use client'
import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { CertificateModal } from '@/components/CertificateModal'
import { loadCertificates, formatMongolianDate, type CertificateEntry } from '@/lib/certificates'
import { loadTestHistory, type TestHistoryEntry } from '@/lib/testHistory'
import { loadStreak } from '@/lib/streak'
import { t } from '@/lib/i18n'

export default function ProfilePage() {
  const [certs, setCerts] = useState<CertificateEntry[]>([])
  const [testHistory, setTestHistory] = useState<TestHistoryEntry[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [selectedCert, setSelectedCert] = useState<CertificateEntry | null>(null)

  useEffect(() => {
    setCerts(loadCertificates())
    setTestHistory(loadTestHistory())
    const s = loadStreak()
    setStreak({ current: s.current, longest: s.longest })
  }, [])

  return (
    <div className="min-h-screen bg-navy">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-gold mb-6">👤 {t('profile')}</h1>

        {/* Streak stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">🔥</div>
            <div className="text-2xl font-bold text-gold">{streak.current}</div>
            <div className="text-xs text-text-secondary">Одоогийн streak</div>
          </div>
          <div className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-2xl font-bold text-gold">{streak.longest}</div>
            <div className="text-xs text-text-secondary">Хамгийн урт streak</div>
          </div>
        </div>

        {/* Certificates */}
        <h2 className="text-lg font-bold text-text-primary mb-4">🎓 {t('certificates')}</h2>

        {certs.length === 0 ? (
          <div className="text-center py-12 text-text-secondary mb-8">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-sm">{t('noCertificates')}</p>
            <p className="text-xs mt-2 text-text-secondary/60">Тест өгч 18/25 аваад гэрчилгээ аваарай!</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {certs.map(cert => (
              <button
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className="w-full bg-navy-surface border border-gold/20 hover:border-gold/50 hover:shadow-[0_0_16px_rgba(245,158,11,0.12)] rounded-xl p-4 flex items-center gap-4 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold font-bold">{cert.level}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm">
                    {cert.level} Тест гэрчилгээ
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {cert.score}/{cert.total} оноо · {formatMongolianDate(cert.date)}
                  </div>
                </div>
                <div className="text-gold text-xs font-medium flex-shrink-0">Харах →</div>
              </button>
            ))}
          </div>
        )}

        {/* Test History */}
        <h2 className="text-lg font-bold text-text-primary mb-4">📋 Шалгалтын түүх</h2>

        {testHistory.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">Шалгалтын түүх байхгүй байна.</p>
            <p className="text-xs mt-2 text-text-secondary/60">Тест эсвэл IELTS өгсний дараа энд харагдана.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testHistory.map(entry => (
              <div
                key={entry.id}
                className="bg-navy-surface border border-navy-surface-2 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-navy-surface-2 flex items-center justify-center flex-shrink-0 text-lg">
                  {entry.type === 'ielts' ? '📝' : '📖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm">
                    {entry.type === 'ielts'
                      ? 'IELTS Mock Test'
                      : `${entry.level} Тест`}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
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
