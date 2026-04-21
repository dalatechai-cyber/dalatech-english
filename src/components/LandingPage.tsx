'use client'
import { LevelSelector } from './LevelSelector'
import { DailyChallenge } from './DailyChallenge'
import { t } from '@/lib/i18n'
import { NavBar } from './NavBar'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-navy">
      <NavBar />

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-transparent to-navy-surface/20 pointer-events-none" />
        {/* Decorative orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 pt-10 sm:pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 text-gold text-xs sm:text-sm font-medium mb-6">
            ✨ Дэлхийн стандартын AI сургалт
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight">
            <span className="text-white">Core </span>
            <span
              className="text-gold"
              style={{ textShadow: '0 0 40px rgba(245,158,11,0.4)' }}
            >
              English
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto mb-3 leading-relaxed">
            Монгол хэлтнүүдэд зориулсан AI англи хэлний сургалт
          </p>
          <p className="text-sm sm:text-base text-text-secondary/70 max-w-lg mx-auto mb-10">
            А1-ээс С1 хүртэл — алдааг монгол хэлээр тайлбарлан, тест өгч гэрчилгээ авна.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { icon: '🧠', text: 'Монгол тайлбар' },
              { icon: '✏️', text: 'Алдаа засах' },
              { icon: '📊', text: 'Дэвшил хянах' },
              { icon: '🏆', text: 'Гэрчилгээ авах' },
            ].map(f => (
              <div
                key={f.text}
                className="bg-navy-surface border border-navy-surface-2 hover:border-gold/30 rounded-xl p-3 text-center transition-colors"
              >
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-xs text-text-secondary">{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16">
        {/* Daily Challenge */}
        <div className="mb-10">
          <DailyChallenge />
        </div>

        {/* Levels */}
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <span className="text-gold">▎</span>
          {t('chooseLevel')}
        </h2>
        <LevelSelector />

        {/* How it works */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="text-gold">▎</span>
            {t('howItWorks')}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '01', title: t('step'), desc: t('step1desc') },
              { step: '02', title: t('step2'), desc: t('step2desc') },
              { step: '03', title: t('step3'), desc: t('step3desc') },
            ].map(s => (
              <div key={s.step} className="bg-navy-surface border border-navy-surface-2 hover:border-gold/30 rounded-xl p-5 transition-colors">
                <div className="text-gold text-3xl font-bold mb-3 opacity-80">{s.step}</div>
                <div className="font-semibold text-text-primary mb-2">{s.title}</div>
                <p className="text-text-secondary text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-navy-surface-2 py-6 text-center text-xs text-text-secondary">
        {t('poweredBy')}{' '}
        <a href="https://dalatech.online/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
          Dalatech.ai
        </a>
      </footer>
    </div>
  )
}
