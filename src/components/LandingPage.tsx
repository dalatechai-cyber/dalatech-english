'use client'
import { LevelSelector } from './LevelSelector'
import { DailyChallenge } from './DailyChallenge'
import { NavBar } from './NavBar'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-navy">
      <NavBar />

      {/* ─── Hero ─── */}
      <header className="relative overflow-hidden min-h-[88vh] flex flex-col items-center justify-center">
        {/* Animated background orb */}
        <div
          className="absolute top-1/3 left-1/2 orb-pulse pointer-events-none"
          style={{
            width: 700,
            height: 400,
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-4 pt-10 pb-16 text-center page-enter-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/25 rounded-full px-4 py-1.5 text-gold text-xs font-semibold mb-8 tracking-wide uppercase">
            ✨ AI-д суурилсан сургалт
          </div>

          {/* Title */}
          <h1
            className="font-extrabold mb-5 leading-none tracking-tight"
            style={{ fontSize: 'clamp(48px, 8vw, 80px)' }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Core
            </span>
            <span className="text-white"> English</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: '#CBD5E1' }}>
            Монгол хэлтнүүдэд зориулсан AI-д суурилсан Англи хэлний дэлхийн стандартын сургалт
          </p>

          {/* Stat badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { icon: '📚', label: '5 Түвшин' },
              { icon: '✏️', label: '50+ Хичээл' },
              { icon: '🎯', label: 'IELTS Бэлтгэл' },
            ].map(s => (
              <div
                key={s.label}
                className="flex items-center gap-2 border border-gold/30 bg-gold/5 rounded-full px-4 py-2 text-sm text-gold font-medium"
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="#levels"
            className="inline-flex items-center gap-2 font-bold text-navy py-4 px-8 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-gold-sm"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              fontSize: 16,
              color: '#0F172A',
            }}
          >
            Сургалт эхлэх →
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce" style={{ color: 'rgba(245,158,11,0.4)', fontSize: 12 }}>
          <span>↓</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16">
        {/* Daily Challenge */}
        <div className="mb-10 page-enter-up" style={{ animationDelay: '0.1s' }}>
          <DailyChallenge />
        </div>

        {/* Features */}
        <section className="mb-14 page-enter-up" style={{ animationDelay: '0.15s' }}>
          <h2
            className="text-xl font-bold mb-2 text-center"
            style={{ color: '#F59E0B', letterSpacing: '-0.02em' }}
          >
            Яагаад Core English?
          </h2>
          <p className="text-sm text-center mb-8" style={{ color: '#64748B' }}>Дэлхийн стандартын сургалтыг монгол хэлтнүүдэд ойлгомжтойгоор</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: '🤖',
                title: 'AI Багш',
                desc: 'Хувийн AI багш таны алдааг тэр даруй засна. Монгол хэлээр тайлбар авна.',
              },
              {
                icon: '📊',
                title: 'Дэвшлийн хяналт',
                desc: 'Streak, оноо, гэрчилгээгээр дэвшлээ хяна. Профайлд бүх үр дүнгээ хар.',
              },
              {
                icon: '🎯',
                title: 'IELTS Бэлтгэл',
                desc: 'Жинхэнэ IELTS шалгалтад бэлд. 4 хэсэгтэй дадлага тест ба band оноо.',
              },
            ].map(f => (
              <div
                key={f.title}
                className="bg-navy-surface border border-gold/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-gold"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-text-primary mb-2" style={{ letterSpacing: '-0.02em' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Level selector */}
        <section id="levels" className="page-enter-up" style={{ animationDelay: '0.2s' }}>
          <h2
            className="text-xl font-bold mb-2"
            style={{ letterSpacing: '-0.02em' }}
          >
            <span className="text-gold">▎</span> Түвшин сонгох
          </h2>
          <p className="text-sm mb-6" style={{ color: '#64748B' }}>
            А1-ээс С1 хүртэл — тэнцсэн тестийн дараа дараагийн түвшин нээгдэнэ
          </p>
          <LevelSelector />
        </section>
      </main>

      <footer className="border-t border-navy-surface-2 py-6 text-center text-xs" style={{ color: '#64748B' }}>
        Powered by{' '}
        <a href="https://dalatech.online/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
          Dalatech.ai
        </a>
      </footer>
    </div>
  )
}
