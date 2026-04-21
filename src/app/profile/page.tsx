'use client'
import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { loadCertificates, formatMongolianDate, type CertificateEntry } from '@/lib/certificates'
import { loadStreak } from '@/lib/streak'
import { t } from '@/lib/i18n'

export default function ProfilePage() {
  const [certs, setCerts] = useState<CertificateEntry[]>([])
  const [streak, setStreak] = useState({ current: 0, longest: 0 })

  useEffect(() => {
    setCerts(loadCertificates())
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
          <div className="text-center py-12 text-text-secondary">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-sm">{t('noCertificates')}</p>
            <p className="text-xs mt-2 text-text-secondary/60">Тест өгч 7/10 аваад гэрчилгээ аваарай!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map(cert => (
              <div
                key={cert.id}
                className="bg-navy-surface border border-gold/20 rounded-xl p-4 flex items-center gap-4"
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
                <div className="text-2xl">🏆</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
