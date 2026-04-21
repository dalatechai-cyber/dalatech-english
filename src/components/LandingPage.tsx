'use client'
import { LevelSelector } from './LevelSelector'
import { DailyChallenge } from './DailyChallenge'
import { useLanguage } from '@/lib/i18n'
import { NavBar } from './NavBar'

export function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-navy">
      <NavBar />
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-navy-surface/30" />
        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-10 text-center">
<h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Core{' '}
            <span className="text-gold">English</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto mb-3">
            Монгол хэлтнүүдэд зориулсан AI англи хэлний сургалт
          </p>
          <p className="text-base text-text-secondary/80 max-w-lg mx-auto mb-8">
            А1-ээс С1 хүртэл — таны алдааг монгол хэлээр тайлбарлан, дэвшлийг хянан, тест өгч гэрчилгээ авна.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12">
            {[
              { icon: '🧠', text: 'Монгол тайлбар' },
              { icon: '✏️', text: 'Алдаа засах' },
              { icon: '📊', text: 'Дэвшил хянах' },
              { icon: '🏆', text: 'Гэрчилгээ авах' },
            ].map(f => (
              <div key={f.text} className="bg-navy-surface border border-navy-surface-2 rounded-xl p-3 text-center">
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
        <h2 className="text-xl font-bold text-text-primary mb-6">
          {t('chooseLevel')}
        </h2>
        <LevelSelector />

        <section className="mt-16">
          <h2 className="text-xl font-bold text-text-primary mb-6">{t('howItWorks')}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '01', title: t('step'), desc: t('step1desc') },
              { step: '02', title: t('step2'), desc: t('step2desc') },
              { step: '03', title: t('step3'), desc: t('step3desc') },
            ].map(s => (
              <div key={s.step} className="bg-navy-surface border border-navy-surface-2 rounded-xl p-5">
                <div className="text-gold text-3xl font-bold mb-3">{s.step}</div>
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
