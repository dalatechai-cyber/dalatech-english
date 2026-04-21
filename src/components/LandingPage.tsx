'use client'
import { LevelSelector } from './LevelSelector'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-navy">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-navy-surface/30" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 text-gold text-sm font-medium mb-6">
            🤖 Claude AI-аар тэжээгддэг
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Dalatech{' '}
            <span className="text-gold">English</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto mb-3">
            Монгол хэлтнүүдэд зориулсан AI англи хэлний сургалт
          </p>
          <p className="text-base text-text-secondary/80 max-w-lg mx-auto mb-8">
            А1-ээс С1 хүртэл — таны алдааг монгол хэлээр тайлбарлан, дэвшлийг хянан, шалгалт өгч дараагийн түвшин рүү ахина.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-12">
            {[
              { icon: '🧠', text: 'Монгол тайлбар' },
              { icon: '✏️', text: 'Алдаа засах' },
              { icon: '📊', text: 'Дэвшил хянах' },
              { icon: '🏆', text: 'Шалгалтаар ахих' },
            ].map(f => (
              <div key={f.text} className="bg-navy-surface border border-navy-surface-2 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-xs text-text-secondary">{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Levels */}
      <main className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold text-text-primary mb-6">
          Түвшин сонгох
        </h2>
        <LevelSelector />

        <section className="mt-16">
          <h2 className="text-xl font-bold text-text-primary mb-6">Хэрхэн ажилладаг вэ?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Хичээл нээнэ', desc: 'А1-ээс эхлэн тус бүрийг дараалан нээнэ. Шалгалтаар тэнцвэл дараагийн түвшин нээгдэнэ.' },
              { step: '02', title: 'AI-тай ярилцана', desc: 'Та англиар бичиж, AI алдааг монгол хэлээр тайлбарлан засна. Зөв бичвэл магтаал авна.' },
              { step: '03', title: 'Ахина', desc: '10-р хичээл бол шалгалт — 15 оноогоос 10+ авбал дараагийн түвшин нээгдэнэ.' },
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
        Powered by{' '}
        <a href="https://dalatech.ai" className="text-gold hover:underline">Dalatech.ai</a>
        {' '}· Built with Claude claude-sonnet-4-6
      </footer>
    </div>
  )
}
